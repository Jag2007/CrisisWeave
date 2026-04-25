import { triageTranscript } from "../services/triage.service";
import { reasonWithLlmOrFallback } from "../services/llm.service";
import { INCIDENT_TYPES, RESOURCE_TYPES, SEVERITIES } from "../utils/enums";
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
  reasoning?: string;
  decision?: string;
}

export class TriageAgent extends BaseAgent<TriageInput, TriageOutput> {
  readonly name = "TRIAGE_AGENT" as const;
  readonly goal = "Understand a raw emergency transcript and convert it into structured incident data.";

  protected async reason(input: TriageInput, _context: AgentContext): Promise<AgentResult<TriageOutput>> {
    const llm = await reasonWithLlmOrFallback<TriageOutput>({
      agentName: this.name,
      goal: this.goal,
      input,
      outputContract:
        '{ "incidentType": one of allowed incident types, "severity": CRITICAL|HIGH|MEDIUM|LOW, "title": string, "description": string, "requiredResourceTypes": array of allowed resource types, "location": { "locationText": string, "city": string, "state": string, "latitude": number, "longitude": number }, "keywords": string[], "reasoning": string, "decision": string }',
      fallback: () => {
        const fallback = triageTranscript(input.rawTranscript);
        return {
          ...fallback,
          location: {
            locationText: input.locationText,
            city: input.city,
            state: input.state,
            latitude: input.latitude,
            longitude: input.longitude
          }
        };
      }
    });
    const triage = sanitizeTriage(llm.data, input);
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
      reasoning:
        String(llm.data.reasoning || "") ||
        `Provider ${llm.provider}: scanned the transcript for emergency signals and inferred ${triage.incidentType}/${triage.severity}.`,
      decision:
        String(llm.data.decision || "") ||
        `Provider ${llm.provider}: classified as ${triage.incidentType}; requires ${triage.requiredResourceTypes.join(", ")}.`,
      critique: llm.provider === "structured_fallback" ? llm.error : `Reasoning provider: ${llm.provider}`
    };
  }
}

function sanitizeTriage(output: TriageOutput, input: TriageInput): TriageOutput {
  const fallback = triageTranscript(input.rawTranscript);
  const incidentType = INCIDENT_TYPES.includes(output.incidentType as any)
    ? output.incidentType
    : fallback.incidentType;
  const severity = SEVERITIES.includes(output.severity as any) ? output.severity : fallback.severity;
  const requiredResourceTypes = Array.isArray(output.requiredResourceTypes)
    ? output.requiredResourceTypes.filter((resource) => RESOURCE_TYPES.includes(resource as any))
    : fallback.requiredResourceTypes;

  return {
    incidentType,
    severity,
    title: output.title || fallback.title,
    description: output.description || input.rawTranscript,
    requiredResourceTypes: requiredResourceTypes.length > 0 ? requiredResourceTypes : fallback.requiredResourceTypes,
    location: output.location || {},
    keywords: Array.isArray(output.keywords) ? output.keywords.map(String) : fallback.keywords
  };
}
