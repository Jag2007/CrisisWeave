import { Incident, type IncidentDocument } from "../models";
import { findDuplicateIncident } from "../services/deduplication.service";
import { reasonWithLlmOrFallback } from "../services/llm.service";
import type { IncidentType } from "../utils/enums";
import { BaseAgent, type AgentContext, type AgentResult } from "./baseAgent";

interface DedupInput extends Record<string, unknown> {
  incidentType: IncidentType;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  reportedAt: string;
}

interface DedupOutput extends Record<string, unknown> {
  isDuplicate: boolean;
  matchedIncidentId?: string;
  matchedIncidentCode?: string;
  confidenceScore: number;
  reasoning?: string;
  decision?: string;
}

export class DedupAgent extends BaseAgent<DedupInput, DedupOutput> {
  readonly name = "DEDUP_AGENT" as const;
  readonly goal = "Check whether a structured emergency report is a duplicate of an active incident.";

  protected async reason(input: DedupInput, _context: AgentContext): Promise<AgentResult<DedupOutput>> {
    const deterministicMatch = await findDuplicateIncident({
      incidentType: input.incidentType,
      latitude: input.latitude,
      longitude: input.longitude,
      city: input.city,
      state: input.state,
      reportedAt: new Date(input.reportedAt)
    });

    const candidates = await Incident.find({
      incidentType: input.incidentType,
      status: { $nin: ["RESOLVED", "CLOSED"] }
    })
      .sort({ lastUpdatedFromCallAt: -1 })
      .limit(8)
      .lean();

    const llm = await reasonWithLlmOrFallback<DedupOutput>({
      agentName: this.name,
      goal: this.goal,
      input: { report: input, candidateIncidents: candidates, deterministicHint: deterministicMatch?._id.toString() },
      outputContract:
        '{ "isDuplicate": boolean, "matchedIncidentId": string|null, "matchedIncidentCode": string|null, "confidenceScore": number 0-1, "reasoning": string, "decision": string }',
      fallback: () => ({
        isDuplicate: Boolean(deterministicMatch),
        matchedIncidentId: deterministicMatch?._id.toString(),
        matchedIncidentCode: deterministicMatch?.incidentCode,
        confidenceScore: deterministicMatch ? (input.latitude && input.longitude ? 0.92 : 0.72) : 0.18
      })
    });

    const matched = await chooseValidMatch(llm.data, deterministicMatch);
    const output: DedupOutput = {
      isDuplicate: Boolean(matched),
      matchedIncidentId: matched?._id.toString(),
      matchedIncidentCode: matched?.incidentCode,
      confidenceScore: matched ? Math.min(1, Math.max(0.5, Number(llm.data.confidenceScore || 0.8))) : 0.18
    };

    return {
      output,
      reasoning:
        llm.data.reasoning ||
        (matched
          ? `Provider ${llm.provider}: matched an active ${input.incidentType} candidate within the configured duplicate logic.`
          : `Provider ${llm.provider}: no active ${input.incidentType} incident should be merged.`),
      decision: llm.data.decision || (matched ? `Treat as duplicate of ${matched.incidentCode}.` : "Create a new incident."),
      critique: llm.provider === "structured_fallback" ? llm.error : `Reasoning provider: ${llm.provider}`
    };
  }
}

async function chooseValidMatch(output: DedupOutput, deterministicMatch: IncidentDocument | null): Promise<IncidentDocument | null> {
  if (!output.isDuplicate) {
    return null;
  }

  if (output.matchedIncidentId) {
    const llmMatch = await Incident.findById(output.matchedIncidentId);
    if (llmMatch && !["RESOLVED", "CLOSED"].includes(llmMatch.status)) {
      return llmMatch;
    }
  }

  return deterministicMatch;
}
