import { Dispatch, Incident, Resource } from "../models";
import type { IncidentDocument, ResourceDocument } from "../models";
import type { ResourceType } from "../utils/enums";
import { generateCode } from "../utils/codeGenerator";
import { estimateArrivalMinutes, haversineKm } from "../utils/distance";
import { writeSystemLog } from "./systemLog.service";

function capabilityScore(resource: ResourceDocument, incidentType: string): number {
  const text = `${incidentType} ${resource.capabilities.join(" ")}`.toLowerCase();
  if (text.includes("trauma") || text.includes("rescue") || text.includes("fire") || text.includes("gas")) {
    return 3;
  }
  return resource.capabilities.length > 0 ? 1 : 0;
}

export async function assignResourcesForIncident(incident: IncidentDocument): Promise<{
  assignedCount: number;
  missingResourceTypes: ResourceType[];
}> {
  await writeSystemLog({
    eventType: "RESOURCE_SEARCH_STARTED",
    message: `Searching available resources for ${incident.incidentCode}.`,
    incidentId: incident._id,
    metadata: { requiredResourceTypes: incident.requiredResourceTypes }
  });

  const missingResourceTypes: ResourceType[] = [];
  const assignedResourceIds: string[] = [];
  const dispatchIds: string[] = [];

  for (const resourceType of incident.requiredResourceTypes) {
    const candidates = await Resource.find({ resourceType, status: "AVAILABLE" });

    if (!incident.latitude || !incident.longitude || candidates.length === 0) {
      missingResourceTypes.push(resourceType);
      continue;
    }

    const ranked = candidates
      .map((resource) => {
        const distanceKm = haversineKm(
          resource.currentLatitude,
          resource.currentLongitude,
          incident.latitude as number,
          incident.longitude as number
        );
        const eta = estimateArrivalMinutes(distanceKm, resourceType);
        const score = distanceKm - capabilityScore(resource, incident.incidentType) - (incident.severity === "CRITICAL" ? 1 : 0);
        return { resource, distanceKm, eta, score };
      })
      .sort((a, b) => a.score - b.score);

    const best = ranked[0];

    if (!best) {
      missingResourceTypes.push(resourceType);
      continue;
    }

    const dispatch = await Dispatch.create({
      dispatchCode: generateCode("DSP"),
      incidentId: incident._id,
      resourceId: best.resource._id,
      resourceType,
      incidentSeverity: incident.severity,
      decisionReason: `Selected ${best.resource.name} for ${resourceType}: available, type match, ${best.distanceKm.toFixed(2)} km away, ETA ${best.eta} min.`,
      distanceKm: Number(best.distanceKm.toFixed(2)),
      estimatedArrivalMinutes: best.eta,
      routeSummary: `Simple haversine route from ${best.resource.baseLocationText || best.resource.name} to ${incident.locationText || incident.city}.`,
      status: "ASSIGNED",
      dispatchedAt: new Date()
    });

    await best.resource.updateOne({
      $set: {
        status: "BUSY",
        assignedIncidentId: incident._id,
        lastStatusUpdatedAt: new Date()
      }
    });

    assignedResourceIds.push(best.resource._id.toString());
    dispatchIds.push(dispatch._id.toString());

    await writeSystemLog({
      eventType: "RESOURCE_ASSIGNED",
      message: `${best.resource.resourceCode} assigned to ${incident.incidentCode}.`,
      incidentId: incident._id,
      resourceId: best.resource._id,
      metadata: { distanceKm: dispatch.distanceKm, etaMinutes: dispatch.estimatedArrivalMinutes }
    });

    await writeSystemLog({
      eventType: "DISPATCH_CREATED",
      message: `${dispatch.dispatchCode} created for ${incident.incidentCode}.`,
      incidentId: incident._id,
      resourceId: best.resource._id,
      dispatchId: dispatch._id,
      metadata: { decisionReason: dispatch.decisionReason }
    });
  }

  await Incident.updateOne(
    { _id: incident._id },
    {
      $set: { status: assignedResourceIds.length > 0 ? "DISPATCHED" : "DISPATCH_PENDING" },
      $addToSet: {
        assignedResourceIds: { $each: assignedResourceIds },
        dispatchIds: { $each: dispatchIds }
      }
    }
  );

  return { assignedCount: assignedResourceIds.length, missingResourceTypes };
}
