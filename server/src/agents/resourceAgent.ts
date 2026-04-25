import { Resource, type ResourceDocument } from "../models";
import { haversineKm } from "../utils/distance";
import type { IncidentType, ResourceType, Severity } from "../utils/enums";
import { BaseAgent, type AgentContext, type AgentResult } from "./baseAgent";

interface ResourceInput extends Record<string, unknown> {
  incidentId: string;
  incidentType: IncidentType;
  severity: Severity;
  latitude?: number;
  longitude?: number;
  requiredResourceTypes: ResourceType[];
  refinementHints?: string[];
}

interface RankedResource {
  resourceId: string;
  resourceCode: string;
  name: string;
  resourceType: ResourceType;
  distanceKm: number;
  matchScore: number;
  reasoning: string;
}

interface ResourceOutput extends Record<string, unknown> {
  rankedResourcesByType: Record<string, RankedResource[]>;
  missingResourceTypes: ResourceType[];
}

function capabilityScore(resource: ResourceDocument, incidentType: IncidentType): number {
  const capabilityText = resource.capabilities.join(" ").toLowerCase();
  const incidentText = incidentType.toLowerCase();
  let score = 0;

  if (capabilityText.includes("trauma") && ["ACCIDENT", "MEDICAL", "BUILDING_COLLAPSE"].includes(incidentType)) score += 10;
  if (capabilityText.includes("fire") && ["FIRE", "GAS_LEAK"].includes(incidentType)) score += 10;
  if (capabilityText.includes("gas") && incidentType === "GAS_LEAK") score += 8;
  if (capabilityText.includes("flood") && incidentType === "FLOOD") score += 8;
  if (capabilityText.includes("collapse") && incidentType === "BUILDING_COLLAPSE") score += 8;
  if (capabilityText.includes("crime") && ["CRIME", "HOME_INTRUSION", "THEFT"].includes(incidentType)) score += 8;
  if (capabilityText.includes(incidentText)) score += 6;
  return score;
}

export class ResourceAgent extends BaseAgent<ResourceInput, ResourceOutput> {
  readonly name = "RESOURCE_AGENT" as const;
  readonly goal = "Find and rank the best available resources using type match, severity, capabilities, and distance.";

  protected async reason(input: ResourceInput, _context: AgentContext): Promise<AgentResult<ResourceOutput>> {
    const rankedResourcesByType: Record<string, RankedResource[]> = {};
    const missingResourceTypes: ResourceType[] = [];
    const urgencyBoost = input.severity === "CRITICAL" ? 8 : input.severity === "HIGH" ? 4 : 0;
    const distanceWeight = input.refinementHints?.includes("prioritize_closer_units") ? 1.4 : 1;

    for (const resourceType of input.requiredResourceTypes) {
      const candidates = await Resource.find({ resourceType, status: "AVAILABLE" });

      if (!input.latitude || !input.longitude || candidates.length === 0) {
        rankedResourcesByType[resourceType] = [];
        missingResourceTypes.push(resourceType);
        continue;
      }

      rankedResourcesByType[resourceType] = candidates
        .map((resource) => {
          const distanceKm = haversineKm(resource.currentLatitude, resource.currentLongitude, input.latitude as number, input.longitude as number);
          const matchScore = 100 + urgencyBoost + capabilityScore(resource, input.incidentType) - distanceKm * distanceWeight;
          return {
            resourceId: resource._id.toString(),
            resourceCode: resource.resourceCode,
            name: resource.name,
            resourceType,
            distanceKm: Number(distanceKm.toFixed(2)),
            matchScore: Number(matchScore.toFixed(2)),
            reasoning: `${resource.resourceCode} is available, matches ${resourceType}, has capabilities [${resource.capabilities.join(", ") || "none"}], and is ${distanceKm.toFixed(2)} km away.`
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);
    }

    return {
      output: { rankedResourcesByType, missingResourceTypes },
      reasoning: `Ranked resources by required type. Score rewards availability, exact type, incident-relevant capabilities, severity urgency, and lower distance.${input.refinementHints?.length ? ` Refinement hints applied: ${input.refinementHints.join(", ")}.` : ""}`,
      decision: missingResourceTypes.length
        ? `Best candidates selected where possible; missing ${missingResourceTypes.join(", ")}.`
        : "Candidate resources ranked for every required type."
    };
  }
}
