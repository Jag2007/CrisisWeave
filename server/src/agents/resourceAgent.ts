import { Resource, type ResourceDocument } from "../models";
import { reasonWithLlmOrFallback } from "../services/llm.service";
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
  reasoning?: string;
  decision?: string;
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
    const deterministicRanked: Record<string, RankedResource[]> = {};
    const missingResourceTypes: ResourceType[] = [];
    const urgencyBoost = input.severity === "CRITICAL" ? 8 : input.severity === "HIGH" ? 4 : 0;
    const distanceWeight = input.refinementHints?.includes("prioritize_closer_units") ? 1.4 : 1;

    for (const resourceType of input.requiredResourceTypes) {
      const candidates = await Resource.find({ resourceType, status: "AVAILABLE" });

      if (!input.latitude || !input.longitude || candidates.length === 0) {
        deterministicRanked[resourceType] = [];
        missingResourceTypes.push(resourceType);
        continue;
      }

      deterministicRanked[resourceType] = candidates
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

    const llm = await reasonWithLlmOrFallback<ResourceOutput>({
      agentName: this.name,
      goal: this.goal,
      input: { ...input, deterministicRanked },
      outputContract:
        '{ "rankedResourcesByType": object keyed by resource type with arrays of { "resourceId": string, "resourceCode": string, "name": string, "resourceType": string, "distanceKm": number, "matchScore": number, "reasoning": string }, "missingResourceTypes": string[], "reasoning": string, "decision": string }',
      fallback: () => ({ rankedResourcesByType: deterministicRanked, missingResourceTypes })
    });

    const rankedResourcesByType = sanitizeRankings(llm.data.rankedResourcesByType, deterministicRanked);
    const finalMissing = input.requiredResourceTypes.filter((resourceType) => !rankedResourcesByType[resourceType]?.length);

    return {
      output: { rankedResourcesByType, missingResourceTypes: finalMissing },
      reasoning:
        llm.data.reasoning ||
        `Provider ${llm.provider}: ranked resources by required type using availability, type, capabilities, severity, and distance.${input.refinementHints?.length ? ` Refinement hints applied: ${input.refinementHints.join(", ")}.` : ""}`,
      decision: llm.data.decision || (finalMissing.length
        ? `Best candidates selected where possible; missing ${finalMissing.join(", ")}.`
        : "Candidate resources ranked for every required type."
      ),
      critique: llm.provider === "structured_fallback" ? llm.error : `Reasoning provider: ${llm.provider}`
    };
  }
}

function sanitizeRankings(
  llmRanked: Record<string, RankedResource[]> | undefined,
  deterministicRanked: Record<string, RankedResource[]>
): Record<string, RankedResource[]> {
  if (!llmRanked || typeof llmRanked !== "object") {
    return deterministicRanked;
  }

  const sanitized: Record<string, RankedResource[]> = {};

  for (const [resourceType, deterministicList] of Object.entries(deterministicRanked)) {
    const allowedById = new Map(deterministicList.map((resource) => [resource.resourceId, resource]));
    const llmList = Array.isArray(llmRanked[resourceType]) ? llmRanked[resourceType] : [];
    const ordered: RankedResource[] = [];

    for (const candidate of llmList) {
      const safe = allowedById.get(candidate.resourceId);
      if (safe && !ordered.some((resource) => resource.resourceId === safe.resourceId)) {
        ordered.push({ ...safe, reasoning: candidate.reasoning || safe.reasoning });
      }
    }

    for (const safe of deterministicList) {
      if (!ordered.some((resource) => resource.resourceId === safe.resourceId)) {
        ordered.push(safe);
      }
    }

    sanitized[resourceType] = ordered;
  }

  return sanitized;
}
