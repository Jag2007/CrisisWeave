import { triageTranscript } from "../services/triage.service";
import { BaseAgent, type AgentContext, type AgentResult } from "./baseAgent";

interface TriageInput extends Record<string, unknown> {
  rawTranscript: string;
  locationText?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

interface TriageOutput extends Record<string, unknown> {
  incidentType: string;
  severity: string;
  title: string;
  description: string;
  requiredResourceTypes: string[];
  location: {
    locationText?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  };
  keywords: string[];
}

export class TriageAgent extends BaseAgent<TriageInput, TriageOutput> {
  readonly name = "TRIAGE_AGENT" as const;
  readonly goal = "Understand a raw emergency transcript and convert it into structured incident data.";

  protected async reason(input: TriageInput, _context: AgentContext): Promise<AgentResult<TriageOutput>> {
    const triage = triageTranscript(input.rawTranscript);
    const output: TriageOutput = {
      ...triage,
      location: {
        locationText: input.locationText,
        city: input.city,
        state: input.state,
        latitude: input.latitude,
        longitude: input.longitude
      }
    };

    return {
      output,
      reasoning: `I scanned the transcript for emergency signals and matched keywords [${triage.keywords.join(", ") || "none"}] to infer ${triage.incidentType}. Severity is ${triage.severity} because the text contains risk indicators aligned with the severity rubric.`,
      decision: `Classified as ${triage.incidentType}; requires ${triage.requiredResourceTypes.join(", ")}.`
    };
  }
}
