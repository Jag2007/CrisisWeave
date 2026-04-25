import { Dispatch, Incident, Resource } from "../models";
import { generateCode } from "../utils/codeGenerator";
import type { ResourceType, Severity } from "../utils/enums";
import { reasonWithLlmOrFallback } from "../services/llm.service";
import { writeSystemLog } from "../services/systemLog.service";
import { BaseAgent, type AgentContext, type AgentResult } from "./baseAgent";

interface DispatchInput extends Record<string, unknown> {
  incidentId: string;
  incidentCode: string;
  incidentSeverity: Severity;
  rankedResourcesByType: Record<string, Array<{
    resourceId: string;
    resourceCode: string;
    name: string;
    resourceType: ResourceType;
    distanceKm: number;
    matchScore: number;
    reasoning: string;
  }>>;
  routes: Array<{
    resourceId: string;
    resourceCode: string;
    resourceType: ResourceType;
    distanceKm: number;
    estimatedArrivalMinutes: number;
    routeSummary: string;
  }>;
}

interface DispatchOutput extends Record<string, unknown> {
  dispatches: Array<{
    dispatchId: string;
    dispatchCode: string;
    resourceId: string;
    resourceCode: string;
    resourceType: ResourceType;
    distanceKm: number;
    estimatedArrivalMinutes: number;
    decisionReason: string;
  }>;
  missingResourceTypes: ResourceType[];
  reasoning?: string;
  decision?: string;
}

export class DispatchAgent extends BaseAgent<DispatchInput, DispatchOutput> {
  readonly name = "DISPATCH_AGENT" as const;
  readonly goal = "Finalize resource assignments and create dispatch records with explicit decision reasoning.";

  protected async reason(input: DispatchInput, context: AgentContext): Promise<AgentResult<DispatchOutput>> {
    const dispatches: DispatchOutput["dispatches"] = [];
    const missingResourceTypes: ResourceType[] = [];
    const llm = await reasonWithLlmOrFallback<{
      selectedResourceIdsByType: Record<string, string>;
      reasoning?: string;
      decision?: string;
    }>({
      agentName: this.name,
      goal: this.goal,
      input,
      outputContract:
        '{ "selectedResourceIdsByType": object mapping each required resource type to exactly one resourceId from rankedResourcesByType, "reasoning": string, "decision": string }',
      fallback: () => ({
        selectedResourceIdsByType: Object.fromEntries(
          Object.entries(input.rankedResourcesByType).map(([resourceType, candidates]) => [
            resourceType,
            candidates[0]?.resourceId
          ])
        ),
        reasoning: "Selected the highest-ranked resource for each required type.",
        decision: "Finalize dispatches for top-ranked resources."
      })
    });

    for (const [resourceType, candidates] of Object.entries(input.rankedResourcesByType) as Array<[ResourceType, DispatchInput["rankedResourcesByType"][string]]>) {
      const preferredId = llm.data.selectedResourceIdsByType?.[resourceType];
      const best = candidates.find((candidate) => candidate.resourceId === preferredId) || candidates[0];
      if (!best) {
        missingResourceTypes.push(resourceType);
        continue;
      }

      const route = input.routes.find((candidateRoute) => candidateRoute.resourceId === best.resourceId);
      const decisionReason = `Agent selected ${best.resourceCode}: highest ranked ${resourceType}, score ${best.matchScore}, ${best.distanceKm} km away. ${best.reasoning}`;

      const dispatch = await Dispatch.create({
        dispatchCode: generateCode("DSP"),
        incidentId: input.incidentId,
        resourceId: best.resourceId,
        resourceType,
        incidentSeverity: input.incidentSeverity,
        decisionReason,
        distanceKm: route?.distanceKm ?? best.distanceKm,
        estimatedArrivalMinutes: route?.estimatedArrivalMinutes ?? 0,
        routeSummary: route?.routeSummary,
        status: "ASSIGNED",
        dispatchedAt: new Date()
      });

      await Resource.updateOne(
        { _id: best.resourceId, status: "AVAILABLE" },
        { $set: { status: "BUSY", assignedIncidentId: input.incidentId, lastStatusUpdatedAt: new Date() } }
      );

      dispatches.push({
        dispatchId: dispatch._id.toString(),
        dispatchCode: dispatch.dispatchCode,
        resourceId: best.resourceId,
        resourceCode: best.resourceCode,
        resourceType,
        distanceKm: dispatch.distanceKm,
        estimatedArrivalMinutes: dispatch.estimatedArrivalMinutes,
        decisionReason
      });

      await writeSystemLog({
        eventType: "RESOURCE_ASSIGNED",
        message: `${best.resourceCode} assigned by Dispatch Agent to ${input.incidentCode}.`,
        incidentId: input.incidentId,
        resourceId: best.resourceId,
        metadata: { graphRunId: context.graphRunId, matchScore: best.matchScore }
      });

      await writeSystemLog({
        eventType: "DISPATCH_CREATED",
        message: `${dispatch.dispatchCode} created by Dispatch Agent for ${input.incidentCode}.`,
        incidentId: input.incidentId,
        resourceId: best.resourceId,
        dispatchId: dispatch._id,
        metadata: { graphRunId: context.graphRunId, decisionReason }
      });
    }

    await Incident.updateOne(
      { _id: input.incidentId },
      {
        $set: { status: dispatches.length > 0 ? "DISPATCHED" : "DISPATCH_PENDING" },
        $addToSet: {
          assignedResourceIds: { $each: dispatches.map((dispatch) => dispatch.resourceId) },
          dispatchIds: { $each: dispatches.map((dispatch) => dispatch.dispatchId) }
        }
      }
    );

    return {
      output: { dispatches, missingResourceTypes },
      reasoning:
        llm.data.reasoning ||
        `Provider ${llm.provider}: selected resources from the ranked candidate lists, then persisted dispatch records and marked assigned units busy.`,
      decision: llm.data.decision || (dispatches.length ? `Created ${dispatches.length} dispatch decisions.` : "No dispatch created because no required resources were available."),
      critique:
        missingResourceTypes.length
          ? `Missing required resource types: ${missingResourceTypes.join(", ")}.`
          : llm.provider === "structured_fallback"
            ? llm.error
            : `Reasoning provider: ${llm.provider}`
    };
  }
}
