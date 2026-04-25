import type { ResourceType, Severity } from "../utils/enums";
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

    const isDecisionOptimal = suggestions.length === 0 || input.retryAttempt >= 1;

    return {
      output: {
        isDecisionOptimal,
        improvementSuggestions: suggestions,
        refinementHints
      },
      reasoning: suggestions.length
        ? `I found ${suggestions.length} concern(s): ${suggestions.join(" ")}`
        : "All required resource types are covered and ETAs are acceptable for the incident severity.",
      decision: isDecisionOptimal ? "Accept dispatch decision." : "Refine resource ranking and dispatch once more.",
      critique: suggestions.join(" ")
    };
  }
}
