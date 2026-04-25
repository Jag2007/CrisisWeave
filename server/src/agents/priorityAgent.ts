import { calculatePriorityScore } from "../services/priority.service";
import { reasonWithLlmOrFallback } from "../services/llm.service";
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
  reasoning?: string;
  decision?: string;
}

export class PriorityAgent extends BaseAgent<PriorityInput, PriorityOutput> {
  readonly name = "PRIORITY_AGENT" as const;
  readonly goal = "Assign an operational priority score that balances severity, incident type, duplicates, keywords, and resource needs.";

  protected async reason(input: PriorityInput, _context: AgentContext): Promise<AgentResult<PriorityOutput>> {
    const fallbackScore = calculatePriorityScore(input);
    const llm = await reasonWithLlmOrFallback<PriorityOutput>({
      agentName: this.name,
      goal: this.goal,
      input,
      outputContract:
        '{ "priorityScore": integer 10-100, "explanation": string, "reasoning": string, "decision": string }',
      fallback: () => ({
        priorityScore: fallbackScore,
        explanation: `${input.severity} baseline adjusted by ${input.incidentType}, ${input.duplicateCount} duplicate reports, keywords [${input.keywords.join(", ") || "none"}], and ${input.requiredResourceTypes.length} resource categories.`
      })
    });

    const priorityScore = clampPriority(llm.data.priorityScore, fallbackScore);
    const explanation =
      llm.data.explanation ||
      `${input.severity} baseline adjusted by ${input.incidentType}, duplicates, keywords, and resource categories.`;

    return {
      output: { priorityScore, explanation },
      reasoning: llm.data.reasoning || `Provider ${llm.provider}: ${explanation}`,
      decision: llm.data.decision || `Priority score set to ${priorityScore}.`,
      critique: llm.provider === "structured_fallback" ? llm.error : `Reasoning provider: ${llm.provider}`
    };
  }
}

function clampPriority(score: unknown, fallbackScore: number): number {
  const parsed = Number(score);
  if (!Number.isFinite(parsed)) {
    return fallbackScore;
  }
  return Math.min(100, Math.max(10, Math.round(parsed)));
}
