import type { Types } from "mongoose";
import { AgentTrace, IncomingCall, Incident } from "../models";
import type { IncidentDocument } from "../models";
import {
  CriticAgent,
  DedupAgent,
  DispatchAgent,
  PriorityAgent,
  ResourceAgent,
  RoutingAgent,
  TriageAgent
} from "../agents";
import type { NormalizedTranscriptRecord } from "../types/upload";
import { generateCode } from "../utils/codeGenerator";
import type { IncidentType, ResourceType, Severity } from "../utils/enums";
import { generateIncidentAlerts } from "../services/alert.service";
import { writeSystemLog } from "../services/systemLog.service";

interface GraphInput {
  batchId: Types.ObjectId;
  incomingCallId: Types.ObjectId;
  record: NormalizedTranscriptRecord;
}

interface GraphOutput {
  incidentId?: string;
  incidentCreated: boolean;
  duplicateFound: boolean;
}

const triageAgent = new TriageAgent();
const dedupAgent = new DedupAgent();
const priorityAgent = new PriorityAgent();
const resourceAgent = new ResourceAgent();
const routingAgent = new RoutingAgent();
const dispatchAgent = new DispatchAgent();
const criticAgent = new CriticAgent();

function createContext(
  input: GraphInput,
  graphRunId: string,
  stepState: { value: number },
  incidentId?: Types.ObjectId,
  retryAttempt = 0
) {
  return {
    graphRunId,
    batchId: input.batchId,
    incomingCallId: input.incomingCallId,
    incidentId,
    retryAttempt,
    nextStep: () => {
      stepState.value += 1;
      return stepState.value;
    }
  };
}

function firstCandidates(rankedResourcesByType: Record<string, any[]>) {
  return Object.values(rankedResourcesByType)
    .map((ranked) => ranked[0])
    .filter(Boolean);
}

async function dispatchWithCritic(input: {
  graphInput: GraphInput;
  graphRunId: string;
  incident: IncidentDocument;
  requiredResourceTypes: ResourceType[];
  severity: Severity;
  incidentType: IncidentType;
  retryAttempt?: number;
  refinementHints?: string[];
  stepState: { value: number };
}): Promise<void> {
  const retryAttempt = input.retryAttempt || 0;
  const context = createContext(input.graphInput, input.graphRunId, input.stepState, input.incident._id, retryAttempt);

  const resourceResult = await resourceAgent.run(
    {
      incidentId: input.incident._id.toString(),
      incidentType: input.incidentType,
      severity: input.severity,
      latitude: input.incident.latitude,
      longitude: input.incident.longitude,
      requiredResourceTypes: input.requiredResourceTypes,
      refinementHints: input.refinementHints
    },
    context
  );

  const selectedCandidates = firstCandidates(resourceResult.output.rankedResourcesByType);
  const routingResult = await routingAgent.run({ selectedCandidates }, context);
  const dispatchResult = await dispatchAgent.run(
    {
      incidentId: input.incident._id.toString(),
      incidentCode: input.incident.incidentCode,
      incidentSeverity: input.severity,
      rankedResourcesByType: resourceResult.output.rankedResourcesByType,
      routes: routingResult.output.routes
    },
    context
  );

  const criticResult = await criticAgent.run(
    {
      severity: input.severity,
      requiredResourceTypes: input.requiredResourceTypes,
      dispatches: dispatchResult.output.dispatches,
      missingResourceTypes: dispatchResult.output.missingResourceTypes,
      retryAttempt
    },
    context
  );

  if (!criticResult.output.isDecisionOptimal && retryAttempt < 1) {
    const dispatchedTypes = new Set(dispatchResult.output.dispatches.map((dispatch) => dispatch.resourceType));
    const retryResourceTypes = input.requiredResourceTypes.filter((resourceType) => !dispatchedTypes.has(resourceType));

    if (retryResourceTypes.length > 0) {
      await dispatchWithCritic({
        ...input,
        requiredResourceTypes: retryResourceTypes,
        retryAttempt: retryAttempt + 1,
        refinementHints: criticResult.output.refinementHints
      });
    }
  }
}

export async function executeGraph(input: GraphInput): Promise<GraphOutput> {
  const graphRunId = generateCode("GRAPH");
  const reportedAt = input.record.callDate || new Date();
  const stepState = { value: 0 };
  const context = createContext(input, graphRunId, stepState);

  await writeSystemLog({
    eventType: "TRIAGE_STARTED",
    message: `Agentic execution graph ${graphRunId} started.`,
    batchId: input.batchId,
    incomingCallId: input.incomingCallId,
    metadata: { graphRunId }
  });

  const triageResult = await triageAgent.run(
    {
      rawTranscript: input.record.rawTranscript,
      locationText: input.record.locationText,
      city: input.record.city,
      state: input.record.state,
      latitude: input.record.latitude,
      longitude: input.record.longitude
    },
    context
  );

  await IncomingCall.updateOne(
    { _id: input.incomingCallId },
    {
      $set: {
        extractedData: triageResult.output,
        processingStatus: "EXTRACTED"
      }
    }
  );

  await writeSystemLog({
    eventType: "TRIAGE_COMPLETED",
    message: `Triage Agent classified call as ${triageResult.output.incidentType}/${triageResult.output.severity}.`,
    batchId: input.batchId,
    incomingCallId: input.incomingCallId,
    metadata: { graphRunId, agentOutput: triageResult.output }
  });

  await writeSystemLog({
    eventType: "DEDUP_CHECK_STARTED",
    message: "Dedup Agent checking active incidents.",
    batchId: input.batchId,
    incomingCallId: input.incomingCallId,
    metadata: { graphRunId }
  });

  const incidentType = triageResult.output.incidentType as IncidentType;
  const severity = triageResult.output.severity as Severity;
  const requiredResourceTypes = triageResult.output.requiredResourceTypes as ResourceType[];
  const keywords = triageResult.output.keywords as string[];

  const dedupResult = await dedupAgent.run(
    {
      incidentType,
      latitude: input.record.latitude,
      longitude: input.record.longitude,
      city: input.record.city,
      state: input.record.state,
      reportedAt: reportedAt.toISOString()
    },
    context
  );

  if (dedupResult.output.isDuplicate && dedupResult.output.matchedIncidentId) {
    const matchedIncident = await Incident.findById(dedupResult.output.matchedIncidentId);
    if (!matchedIncident) {
      throw new Error("Dedup Agent matched an incident that no longer exists.");
    }

    const nextDuplicateCount = matchedIncident.duplicateCount + 1;
    const priorityContext = createContext(input, graphRunId, stepState, matchedIncident._id);
    const priorityResult = await priorityAgent.run(
      {
        severity: matchedIncident.severity,
        incidentType: matchedIncident.incidentType,
        duplicateCount: nextDuplicateCount,
        keywords,
        requiredResourceTypes: matchedIncident.requiredResourceTypes
      },
      priorityContext
    );

    await Incident.updateOne(
      { _id: matchedIncident._id },
      {
        $addToSet: { incomingCallIds: input.incomingCallId },
        $set: {
          duplicateCount: nextDuplicateCount,
          lastUpdatedFromCallAt: reportedAt,
          priorityScore: priorityResult.output.priorityScore
        }
      }
    );

    await IncomingCall.updateOne(
      { _id: input.incomingCallId },
      {
        $set: {
          linkedIncidentId: matchedIncident._id,
          duplicateOfIncidentId: matchedIncident._id,
          isDuplicate: true,
          processingStatus: "DUPLICATE"
        }
      }
    );

    await AgentTrace.updateMany({ graphRunId }, { $set: { incidentId: matchedIncident._id } });

    await writeSystemLog({
      eventType: "DUPLICATE_FOUND",
      message: `Dedup Agent matched ${matchedIncident.incidentCode} with confidence ${dedupResult.output.confidenceScore}.`,
      batchId: input.batchId,
      incomingCallId: input.incomingCallId,
      incidentId: matchedIncident._id,
      metadata: { graphRunId, confidenceScore: dedupResult.output.confidenceScore }
    });

    await writeSystemLog({
      eventType: "INCIDENT_UPDATED",
      message: `Priority Agent refreshed ${matchedIncident.incidentCode} to ${priorityResult.output.priorityScore}.`,
      batchId: input.batchId,
      incomingCallId: input.incomingCallId,
      incidentId: matchedIncident._id,
      metadata: { graphRunId, priority: priorityResult.output }
    });

    return {
      incidentId: matchedIncident._id.toString(),
      incidentCreated: false,
      duplicateFound: true
    };
  }

  const priorityResult = await priorityAgent.run(
    {
      severity,
      incidentType,
      duplicateCount: 0,
      keywords,
      requiredResourceTypes
    },
    context
  );

  const incident = await Incident.create({
    incidentCode: generateCode("INC"),
    title: String(triageResult.output.title),
    description: String(triageResult.output.description),
    incidentType,
    severity,
    priorityScore: priorityResult.output.priorityScore,
    status: "NEW",
    locationText: input.record.locationText,
    city: input.record.city,
    state: input.record.state,
    latitude: input.record.latitude,
    longitude: input.record.longitude,
    requiredResourceTypes,
    incomingCallIds: [input.incomingCallId],
    duplicateCount: 0,
    firstReportedAt: reportedAt,
    lastUpdatedFromCallAt: reportedAt
  });

  await IncomingCall.updateOne(
    { _id: input.incomingCallId },
    {
      $set: {
        linkedIncidentId: incident._id,
        processingStatus: "INCIDENT_CREATED"
      }
    }
  );

  await AgentTrace.updateMany({ graphRunId }, { $set: { incidentId: incident._id } });

  await writeSystemLog({
    eventType: "INCIDENT_CREATED",
    message: `${incident.incidentCode} created by agent graph ${graphRunId}.`,
    batchId: input.batchId,
    incomingCallId: input.incomingCallId,
    incidentId: incident._id,
    metadata: { graphRunId }
  });

  await writeSystemLog({
    eventType: "PRIORITY_ASSIGNED",
    message: `Priority Agent assigned ${incident.incidentCode} score ${priorityResult.output.priorityScore}.`,
    batchId: input.batchId,
    incomingCallId: input.incomingCallId,
    incidentId: incident._id,
    metadata: { graphRunId, priority: priorityResult.output }
  });

  await dispatchWithCritic({
    graphInput: input,
    graphRunId,
    incident,
    requiredResourceTypes,
    severity,
    incidentType,
    stepState
  });

  await generateIncidentAlerts(incident);

  return {
    incidentId: incident._id.toString(),
    incidentCreated: true,
    duplicateFound: false
  };
}
