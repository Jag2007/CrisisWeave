import { IncomingCall, Incident, UploadBatch } from "../models";
import type { EmergencyTranscriptInput, NormalizedTranscriptRecord } from "../types/upload";
import { generateCode } from "../utils/codeGenerator";
import { calculatePriorityScore } from "./priority.service";
import { findDuplicateIncident } from "./deduplication.service";
import { assignResourcesForIncident } from "./dispatch.service";
import { generateIncidentAlerts } from "./alert.service";
import { triageTranscript } from "./triage.service";
import { writeSystemLog } from "./systemLog.service";

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeRecords(payload: unknown): NormalizedTranscriptRecord[] {
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { records?: unknown[] })?.records)
      ? (payload as { records: unknown[] }).records
      : Array.isArray((payload as { transcripts?: unknown[] })?.transcripts)
        ? (payload as { transcripts: unknown[] }).transcripts
        : [];

  return records
    .map((record) => record as EmergencyTranscriptInput)
    .map((record) => ({
      rawTranscript: String(record.rawTranscript || record.transcript || record.text || "").trim(),
      callDate: record.callDate || record.date ? new Date(String(record.callDate || record.date)) : undefined,
      startTime: record.startTime,
      endTime: record.endTime,
      locationText: record.locationText,
      city: record.city,
      state: record.state,
      latitude: parseNumber(record.latitude),
      longitude: parseNumber(record.longitude),
      callerName: record.callerName,
      callerPhone: record.callerPhone,
      sourceId: record.sourceId || record.source
    }))
    .filter((record) => record.rawTranscript.length > 0);
}

export async function processUploadedJson(input: {
  payload: unknown;
  originalFileName: string;
  uploadedBy?: string;
  uploadSource?: string;
}): Promise<{
  batchId: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  incidentsCreated: number;
  duplicatesFound: number;
}> {
  const records = normalizeRecords(input.payload);

  if (records.length === 0) {
    throw new Error("No transcript records found. Upload an array, { records: [...] }, or { transcripts: [...] }.");
  }

  const batch = await UploadBatch.create({
    originalFileName: input.originalFileName,
    uploadedBy: input.uploadedBy,
    totalRecords: records.length,
    processedRecords: 0,
    failedRecords: 0,
    status: "PROCESSING",
    uploadSource: input.uploadSource || "json_upload"
  });

  await writeSystemLog({
    eventType: "BATCH_UPLOADED",
    message: `${records.length} transcript records uploaded from ${input.originalFileName}.`,
    batchId: batch._id,
    metadata: { originalFileName: input.originalFileName }
  });

  let processedRecords = 0;
  let failedRecords = 0;
  let incidentsCreated = 0;
  let duplicatesFound = 0;

  for (const record of records) {
    let incomingCallId: unknown;

    try {
      const incomingCall = await IncomingCall.create({
        batchId: batch._id,
        ...record,
        processingStatus: "PENDING",
        isDuplicate: false
      });
      incomingCallId = incomingCall._id;

      await writeSystemLog({
        eventType: "CALL_STORED",
        message: "Raw transcript stored as incoming call.",
        batchId: batch._id,
        incomingCallId: incomingCall._id,
        metadata: { sourceId: record.sourceId }
      });

      await writeSystemLog({
        eventType: "TRIAGE_STARTED",
        message: "Rule-based triage started.",
        batchId: batch._id,
        incomingCallId: incomingCall._id
      });

      const triage = triageTranscript(record.rawTranscript);
      await incomingCall.updateOne({
        $set: {
          extractedData: {
            ...triage,
            locationText: record.locationText,
            city: record.city,
            state: record.state,
            latitude: record.latitude,
            longitude: record.longitude
          },
          processingStatus: "EXTRACTED"
        }
      });

      await writeSystemLog({
        eventType: "TRIAGE_COMPLETED",
        message: `Triage completed: ${triage.incidentType}/${triage.severity}.`,
        batchId: batch._id,
        incomingCallId: incomingCall._id,
        metadata: triage as unknown as Record<string, unknown>
      });

      await writeSystemLog({
        eventType: "DEDUP_CHECK_STARTED",
        message: "Checking for nearby active duplicate incidents.",
        batchId: batch._id,
        incomingCallId: incomingCall._id,
        metadata: { incidentType: triage.incidentType }
      });

      const reportedAt = record.callDate || new Date();
      const duplicateIncident = await findDuplicateIncident({
        incidentType: triage.incidentType,
        latitude: record.latitude,
        longitude: record.longitude,
        city: record.city,
        state: record.state,
        reportedAt
      });

      if (duplicateIncident) {
        const nextDuplicateCount = duplicateIncident.duplicateCount + 1;
        const priorityScore = calculatePriorityScore({
          severity: duplicateIncident.severity,
          incidentType: duplicateIncident.incidentType,
          duplicateCount: nextDuplicateCount,
          keywords: triage.keywords,
          requiredResourceTypes: duplicateIncident.requiredResourceTypes
        });

        await Incident.updateOne(
          { _id: duplicateIncident._id },
          {
            $addToSet: { incomingCallIds: incomingCall._id },
            $set: {
              duplicateCount: nextDuplicateCount,
              lastUpdatedFromCallAt: reportedAt,
              priorityScore
            }
          }
        );

        await incomingCall.updateOne({
          $set: {
            linkedIncidentId: duplicateIncident._id,
            duplicateOfIncidentId: duplicateIncident._id,
            isDuplicate: true,
            processingStatus: "DUPLICATE"
          }
        });

        duplicatesFound += 1;

        await writeSystemLog({
          eventType: "DUPLICATE_FOUND",
          message: `Incoming call matched existing incident ${duplicateIncident.incidentCode}.`,
          batchId: batch._id,
          incomingCallId: incomingCall._id,
          incidentId: duplicateIncident._id
        });

        await writeSystemLog({
          eventType: "INCIDENT_UPDATED",
          message: `${duplicateIncident.incidentCode} updated with duplicate report and priority ${priorityScore}.`,
          batchId: batch._id,
          incomingCallId: incomingCall._id,
          incidentId: duplicateIncident._id,
          metadata: { duplicateCount: nextDuplicateCount, priorityScore }
        });

        await writeSystemLog({
          eventType: "PRIORITY_ASSIGNED",
          message: `${duplicateIncident.incidentCode} priority score refreshed to ${priorityScore}.`,
          batchId: batch._id,
          incomingCallId: incomingCall._id,
          incidentId: duplicateIncident._id,
          metadata: { priorityScore }
        });
      } else {
        const priorityScore = calculatePriorityScore({
          severity: triage.severity,
          incidentType: triage.incidentType,
          duplicateCount: 0,
          keywords: triage.keywords,
          requiredResourceTypes: triage.requiredResourceTypes
        });

        const incident = await Incident.create({
          incidentCode: generateCode("INC"),
          title: triage.title,
          description: triage.description,
          incidentType: triage.incidentType,
          severity: triage.severity,
          priorityScore,
          status: "NEW",
          locationText: record.locationText,
          city: record.city,
          state: record.state,
          latitude: record.latitude,
          longitude: record.longitude,
          requiredResourceTypes: triage.requiredResourceTypes,
          incomingCallIds: [incomingCall._id],
          duplicateCount: 0,
          firstReportedAt: reportedAt,
          lastUpdatedFromCallAt: reportedAt
        });

        await incomingCall.updateOne({
          $set: {
            linkedIncidentId: incident._id,
            processingStatus: "INCIDENT_CREATED"
          }
        });

        incidentsCreated += 1;

        await writeSystemLog({
          eventType: "INCIDENT_CREATED",
          message: `${incident.incidentCode} created from incoming call.`,
          batchId: batch._id,
          incomingCallId: incomingCall._id,
          incidentId: incident._id
        });

        await writeSystemLog({
          eventType: "PRIORITY_ASSIGNED",
          message: `${incident.incidentCode} priority score set to ${priorityScore}.`,
          batchId: batch._id,
          incomingCallId: incomingCall._id,
          incidentId: incident._id,
          metadata: { priorityScore }
        });

        await assignResourcesForIncident(incident);
        await generateIncidentAlerts(incident);
      }

      processedRecords += 1;
    } catch (error) {
      failedRecords += 1;
      const message = error instanceof Error ? error.message : "Unknown pipeline error";

      if (incomingCallId) {
        await IncomingCall.updateOne(
          { _id: incomingCallId },
          { $set: { processingStatus: "FAILED", errorMessage: message } }
        );
      }

      await writeSystemLog({
        eventType: "PIPELINE_FAILED",
        message,
        batchId: batch._id,
        incomingCallId
      });
    }
  }

  await batch.updateOne({
    $set: {
      processedRecords,
      failedRecords,
      status: failedRecords > 0 ? "FAILED" : "COMPLETED"
    }
  });

  await writeSystemLog({
    eventType: failedRecords > 0 ? "PIPELINE_FAILED" : "PIPELINE_COMPLETED",
    message: `Batch ${batch._id.toString()} completed with ${processedRecords} processed and ${failedRecords} failed.`,
    batchId: batch._id,
    metadata: { incidentsCreated, duplicatesFound }
  });

  return {
    batchId: batch._id.toString(),
    totalRecords: records.length,
    processedRecords,
    failedRecords,
    incidentsCreated,
    duplicatesFound
  };
}
