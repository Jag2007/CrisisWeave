// Critic Agent reviews the full graph decision and explains refinements in
// plain language so judges can understand why the system accepted or retried.
import type { ResourceType, Severity } from "../utils/enums";
import { reasonWithLlmOrFallback } from "../services/llm.service";
import { BaseAgent, type AgentContext, type AgentResult } from "./baseAgent";

interface CriticInput extends Record<string, unknown> {
  severity: Severity;
  requiredResourceTypes: ResourceType[];
  dispatches: Array<{
    resourceType: ResourceType;
    distanceKm: number;
    estimatedArrivalMinutes: number;
  }>;
  missingResourceTypes: ResourceType[];
  retryAttempt: number;
}

interface CriticOutput extends Record<string, unknown> {
  isDecisionOptimal: boolean;
  improvementSuggestions: string[];
  refinementHints: string[];
  reasoning?: string;
  decision?: string;
}

export class CriticAgent extends BaseAgent<CriticInput, CriticOutput> {
  readonly name = "CRITIC_AGENT" as const;
  readonly goal = "Evaluate the full incident response decision and request refinement when it can be improved.";

  protected async reason(input: CriticInput, _context: AgentContext): Promise<AgentResult<CriticOutput>> {
    const suggestions: string[] = [];
    const refinementHints: string[] = [];
    const coveredTypes = new Set(input.dispatches.map((dispatch) => dispatch.resourceType));
    const uncovered = input.requiredResourceTypes.filter((resourceType) => !coveredTypes.has(resourceType));
    const slowCritical = input.severity === "CRITICAL" && input.dispatches.some((dispatch) => dispatch.estimatedArrivalMinutes > 18);

    if (uncovered.length > 0 || input.missingResourceTypes.length > 0) {
      suggestions.push(`Find coverage for missing resource types: ${[...new Set([...uncovered, ...input.missingResourceTypes])].join(", ")}.`);
    }

    if (slowCritical) {
      suggestions.push("Critical incident has a slow ETA; re-rank with stronger preference for closer units.");
      refinementHints.push("prioritize_closer_units");
    }

    const deterministic = {
      isDecisionOptimal: suggestions.length === 0 || input.retryAttempt >= 1,
      improvementSuggestions: suggestions,
      refinementHints
    };

    const llm = await reasonWithLlmOrFallback<CriticOutput>({
      agentName: this.name,
      goal: this.goal,
      input: { ...input, deterministicCritique: deterministic },
      outputContract:
        '{ "isDecisionOptimal": boolean, "improvementSuggestions": string[], "refinementHints": string[], "reasoning": string, "decision": string }',
      fallback: () => deterministic
    });

    const safeOutput = sanitizeCritic(llm.data, deterministic, input.retryAttempt);

    const acceptedWithLimitations = safeOutput.isDecisionOptimal && safeOutput.improvementSuggestions.length > 0;
    const reasoning =
      llm.data.reasoning ||
      (acceptedWithLimitations
        ? `The graph retried once. Some resource types are still unavailable, so CrisisWeave keeps the best available dispatch and marks the remaining coverage gap clearly.`
        : safeOutput.improvementSuggestions.length
          ? `Found ${safeOutput.improvementSuggestions.length} issue(s): ${safeOutput.improvementSuggestions.join(" ")}`
          : "All required resource types are covered and ETAs are acceptable.");
    const decision = acceptedWithLimitations
      ? "Accept with limitations after retry; keep searching for missing resource coverage."
      : llm.data.decision || (safeOutput.isDecisionOptimal ? "Accept dispatch decision." : "Refine resource ranking and dispatch once more.");

    return {
      output: safeOutput,
      reasoning,
      decision,
      critique:
        safeOutput.improvementSuggestions.join(" ") ||
        (llm.provider === "structured_fallback" ? llm.error : `Reasoning provider: ${llm.provider}`)
    };
  }
}

function sanitizeCritic(output: CriticOutput, deterministic: CriticOutput, retryAttempt: number): CriticOutput {
  const suggestions = Array.isArray(output.improvementSuggestions)
    ? output.improvementSuggestions.map(String)
    : deterministic.improvementSuggestions;
  const hints = Array.isArray(output.refinementHints)
    ? output.refinementHints.map(String)
    : deterministic.refinementHints;

  return {
    isDecisionOptimal: retryAttempt >= 1 ? true : Boolean(output.isDecisionOptimal ?? deterministic.isDecisionOptimal),
    improvementSuggestions: suggestions,
    refinementHints: hints
  };
}
