import { Alert, Incident } from "../models";
import type { IncidentDocument } from "../models";
import type { AlertType, IncidentType } from "../utils/enums";
import { generateCode } from "../utils/codeGenerator";
import { writeSystemLog } from "./systemLog.service";

const alertTypeMap: Partial<Record<IncidentType, AlertType>> = {
  MEDICAL: "HOSPITAL_ALERT",
  FIRE: "FIRE_STATION_ALERT",
  GAS_LEAK: "FIRE_STATION_ALERT",
  CRIME: "POLICE_ALERT",
  HOME_INTRUSION: "POLICE_ALERT",
  THEFT: "POLICE_ALERT",
  BUILDING_COLLAPSE: "RESCUE_ALERT",
  FLOOD: "RESCUE_ALERT",
  POWER_FAILURE: "UTILITY_ALERT",
  MISSING_PET: "ANIMAL_RESCUE_ALERT"
};

const organizationNames: Record<AlertType, string> = {
  HOSPITAL_ALERT: "Nearest Hyderabad Trauma Hospital",
  FIRE_STATION_ALERT: "Hyderabad Fire Control Room",
  POLICE_ALERT: "Hyderabad Police Command Center",
  RESCUE_ALERT: "Greater Hyderabad Rescue Coordination Unit",
  ADMIN_ALERT: "CrisisWeave Admin Desk",
  UTILITY_ALERT: "Hyderabad Utility Response Center",
  ANIMAL_RESCUE_ALERT: "Hyderabad Animal Rescue Network"
};

export async function generateIncidentAlerts(incident: IncidentDocument): Promise<string[]> {
  const alertTypes = new Set<AlertType>();
  const mappedType = alertTypeMap[incident.incidentType];

  if (mappedType) {
    alertTypes.add(mappedType);
  }

  if (incident.severity === "CRITICAL") {
    alertTypes.add("ADMIN_ALERT");
  }

  const alertIds: string[] = [];

  for (const alertType of alertTypes) {
    const alert = await Alert.create({
      alertCode: generateCode("ALT"),
      incidentId: incident._id,
      alertType,
      targetOrganization: organizationNames[alertType],
      message: `${incident.severity} ${incident.incidentType} incident at ${incident.locationText || incident.city || "reported location"}: ${incident.title}`,
      severity: incident.severity,
      status: "SENT",
      generatedAt: new Date(),
      sentAt: new Date()
    });

    alertIds.push(alert._id.toString());
    await writeSystemLog({
      eventType: "ALERT_CREATED",
      message: `Simulated ${alertType} generated for ${incident.incidentCode}.`,
      incidentId: incident._id,
      metadata: { alertCode: alert.alertCode, targetOrganization: alert.targetOrganization }
    });
  }

  if (alertIds.length > 0) {
    await Incident.updateOne({ _id: incident._id }, { $addToSet: { alertIds: { $each: alertIds } } });
  }

  return alertIds;
}
