import { calculatePriorityScore } from "../services/priority.service";
import type { IncidentType, ResourceType, Severity } from "../utils/enums";
import { BaseAgent, type AgentContext, type AgentResult } from "./baseAgent";

interface PriorityInput extends Record<string, unknown> {
  severity: Severity;
  incidentType: IncidentType;
  duplicateCount: number;
  keywords: string[];
  requiredResourceTypes: ResourceType[];
}

interface PriorityOutput extends Record<string, unknown> {
  priorityScore: number;
  explanation: string;
}

export class PriorityAgent extends BaseAgent<PriorityInput, PriorityOutput> {
  readonly name = "PRIORITY_AGENT" as const;
  readonly goal = "Assign an operational priority score that balances severity, incident type, duplicates, keywords, and resource needs.";

  protected async reason(input: PriorityInput, _context: AgentContext): Promise<AgentResult<PriorityOutput>> {
    const priorityScore = calculatePriorityScore(input);
    const explanation = `${input.severity} baseline adjusted by ${input.incidentType}, ${input.duplicateCount} duplicate reports, keywords [${input.keywords.join(", ") || "none"}], and ${input.requiredResourceTypes.length} resource categories.`;

    return {
      output: { priorityScore, explanation },
      reasoning: explanation,
      decision: `Priority score set to ${priorityScore}.`
    };
  }
}
