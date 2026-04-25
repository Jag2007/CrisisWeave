import { AgentTrace, Alert, Dispatch, Incident, IncomingCall, Resource, SystemLog, UploadBatch } from "../models";

async function groupCount(model: typeof Incident, field: string, match = {}) {
  return model.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
}

export async function getDashboardSummary() {
  const activeIncidentMatch = { status: { $nin: ["RESOLVED", "CLOSED"] } };

  const [
    totalUploadedBatches,
    totalIncomingCalls,
    totalActiveIncidents,
    duplicateCallsCount,
    incidentsBySeverity,
    incidentsByType,
    availableResources,
    busyResources,
    totalDispatches,
    totalAlerts,
    totalAgentTraces,
    recentSystemLogs
  ] = await Promise.all([
    UploadBatch.countDocuments(),
    IncomingCall.countDocuments(),
    Incident.countDocuments(activeIncidentMatch),
    IncomingCall.countDocuments({ isDuplicate: true }),
    groupCount(Incident, "severity", activeIncidentMatch),
    groupCount(Incident, "incidentType", activeIncidentMatch),
    Resource.countDocuments({ status: "AVAILABLE" }),
    Resource.countDocuments({ status: "BUSY" }),
    Dispatch.countDocuments(),
    Alert.countDocuments(),
    AgentTrace.countDocuments(),
    SystemLog.find().sort({ createdAt: -1 }).limit(15).lean()
  ]);

  return {
    totalUploadedBatches,
    totalIncomingCalls,
    totalActiveIncidents,
    duplicateCallsCount,
    incidentsBySeverity,
    incidentsByType,
    availableResources,
    busyResources,
    totalDispatches,
    totalAlerts,
    totalAgentTraces,
    recentSystemLogs
  };
}
