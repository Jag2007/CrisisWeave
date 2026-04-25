import { Incident, type IncidentDocument } from "../models";
import type { IncidentType } from "../utils/enums";
import { toGeoPoint } from "../utils/geo";

const DEFAULT_RADIUS_KM = Number(process.env.DEDUP_RADIUS_KM || 1);
const DEFAULT_WINDOW_MINUTES = Number(process.env.DEDUP_WINDOW_MINUTES || 60);

export async function findDuplicateIncident(input: {
  incidentType: IncidentType;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  reportedAt: Date;
}): Promise<IncidentDocument | null> {
  const cutoff = new Date(input.reportedAt.getTime() - DEFAULT_WINDOW_MINUTES * 60 * 1000);
  const baseQuery = {
    incidentType: input.incidentType,
    status: { $nin: ["RESOLVED", "CLOSED"] },
    firstReportedAt: { $gte: cutoff }
  };

  const location = toGeoPoint(input.latitude, input.longitude);

  if (location) {
    return Incident.findOne({
      ...baseQuery,
      location: {
        $near: {
          $geometry: location,
          $maxDistance: DEFAULT_RADIUS_KM * 1000
        }
      }
    });
  }

  return Incident.findOne({
    ...baseQuery,
    city: input.city,
    state: input.state
  }).sort({ lastUpdatedFromCallAt: -1 });
}
