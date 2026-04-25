import type { IncidentDocument } from "../models";
import { findDuplicateIncident } from "../services/deduplication.service";
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
}

export class DedupAgent extends BaseAgent<DedupInput, DedupOutput> {
  readonly name = "DEDUP_AGENT" as const;
  readonly goal = "Check whether a structured emergency report is a duplicate of an active incident.";

  protected async reason(input: DedupInput, _context: AgentContext): Promise<AgentResult<DedupOutput>> {
    const matched: IncidentDocument | null = await findDuplicateIncident({
      incidentType: input.incidentType,
      latitude: input.latitude,
      longitude: input.longitude,
      city: input.city,
      state: input.state,
      reportedAt: new Date(input.reportedAt)
    });

    const output: DedupOutput = {
      isDuplicate: Boolean(matched),
      matchedIncidentId: matched?._id.toString(),
      matchedIncidentCode: matched?.incidentCode,
      confidenceScore: matched ? (input.latitude && input.longitude ? 0.92 : 0.72) : 0.18
    };

    return {
      output,
      reasoning: matched
        ? `I found an active ${input.incidentType} incident within the configured geospatial/time window, so the new report likely describes the same event.`
        : `No active ${input.incidentType} incident matched the configured proximity and recency constraints.`,
      decision: matched ? `Treat as duplicate of ${matched.incidentCode}.` : "Create a new incident."
    };
  }
}
