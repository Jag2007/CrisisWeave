import { estimateArrivalMinutes } from "../utils/distance";
import type { ResourceType } from "../utils/enums";
import { BaseAgent, type AgentContext, type AgentResult } from "./baseAgent";

interface RoutingInput extends Record<string, unknown> {
  selectedCandidates: Array<{
    resourceId: string;
    resourceCode: string;
    name: string;
    resourceType: ResourceType;
    distanceKm: number;
    matchScore: number;
    reasoning: string;
  }>;
}

interface RoutingOutput extends Record<string, unknown> {
  routes: Array<{
    resourceId: string;
    resourceCode: string;
    resourceType: ResourceType;
    distanceKm: number;
    estimatedArrivalMinutes: number;
    routeSummary: string;
  }>;
}

export class RoutingAgent extends BaseAgent<RoutingInput, RoutingOutput> {
  readonly name = "ROUTING_AGENT" as const;
  readonly goal = "Estimate travel distance and ETA for selected candidate resources.";

  protected async reason(input: RoutingInput, _context: AgentContext): Promise<AgentResult<RoutingOutput>> {
    const routes = input.selectedCandidates.map((candidate) => ({
      resourceId: candidate.resourceId,
      resourceCode: candidate.resourceCode,
      resourceType: candidate.resourceType,
      distanceKm: candidate.distanceKm,
      estimatedArrivalMinutes: estimateArrivalMinutes(candidate.distanceKm, candidate.resourceType),
      routeSummary: `Haversine demo route for ${candidate.resourceCode}: ${candidate.distanceKm} km at configured ${candidate.resourceType} response speed.`
    }));

    return {
      output: { routes },
      reasoning: "Used haversine distance from resource location to incident and resource-type average speed to estimate arrival.",
      decision: routes.length ? `Computed ${routes.length} route estimates.` : "No routes computed because no resources were selected."
    };
  }
}
