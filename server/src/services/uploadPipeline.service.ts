// Upload pipeline entrypoint. It stores batches immediately, then runs the
// agent graph in the background so frontend navigation does not cancel progress.
import type { Types } from "mongoose";
import { IncomingCall, UploadBatch } from "../models";
import { executeGraph } from "../graph/agentGraph";
import type { EmergencyTranscriptInput, NormalizedTranscriptRecord } from "../types/upload";
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
    metadata: { originalFileName: input.originalFileName, executionMode: "agent_graph" }
  });

  const result = await processBatchRecords(batch._id, records);

  return {
    batchId: batch._id.toString(),
    totalRecords: records.length,
    ...result
  };
}

export async function startUploadedJsonProcessing(input: {
  payload: unknown;
  originalFileName: string;
  uploadedBy?: string;
  uploadSource?: string;
}): Promise<{
  batchId: string;
  totalRecords: number;
  status: "PROCESSING";
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
    message: `${records.length} transcript records uploaded from ${input.originalFileName}. Agent graph is processing in the background.`,
    batchId: batch._id,
    metadata: { originalFileName: input.originalFileName, executionMode: "agent_graph_background" }
  });

  setImmediate(() => {
    void processBatchRecords(batch._id, records);
  });

  return {
    batchId: batch._id.toString(),
    totalRecords: records.length,
    status: "PROCESSING"
  };
}

async function processBatchRecords(
  batchId: Types.ObjectId,
  records: NormalizedTranscriptRecord[]
): Promise<{
  processedRecords: number;
  failedRecords: number;
  incidentsCreated: number;
  duplicatesFound: number;
}> {
  let processedRecords = 0;
  let failedRecords = 0;
  let incidentsCreated = 0;
  let duplicatesFound = 0;

  for (const record of records) {
    let incomingCallId: unknown;

    try {
      const incomingCall = await IncomingCall.create({
        batchId,
        ...record,
        processingStatus: "PENDING",
        isDuplicate: false
      });
      incomingCallId = incomingCall._id;

      await writeSystemLog({
        eventType: "CALL_STORED",
        message: "Raw transcript stored as incoming call before agent graph execution.",
        batchId,
        incomingCallId: incomingCall._id,
        metadata: { sourceId: record.sourceId }
      });

      const graphResult = await executeGraph({
        batchId,
        incomingCallId: incomingCall._id,
        record
      });

      if (graphResult.incidentCreated) {
        incidentsCreated += 1;
      }

      if (graphResult.duplicateFound) {
        duplicatesFound += 1;
      }

      processedRecords += 1;
      await UploadBatch.updateOne({ _id: batchId }, { $set: { processedRecords, failedRecords } });
    } catch (error) {
      failedRecords += 1;
      const message = error instanceof Error ? error.message : "Unknown pipeline error";

      if (incomingCallId) {
        await IncomingCall.updateOne(
          { _id: incomingCallId },
          { $set: { processingStatus: "FAILED", errorMessage: message } }
        );
      }

      await UploadBatch.updateOne({ _id: batchId }, { $set: { processedRecords, failedRecords } });
      await writeSystemLog({
        eventType: "PIPELINE_FAILED",
        message,
        batchId,
        incomingCallId
      });
    }
  }

  await UploadBatch.updateOne({
    _id: batchId
  }, {
    $set: {
      processedRecords,
      failedRecords,
      status: failedRecords > 0 ? "FAILED" : "COMPLETED"
    }
  });

  await writeSystemLog({
    eventType: failedRecords > 0 ? "PIPELINE_FAILED" : "PIPELINE_COMPLETED",
    message: `Agent graph batch ${String(batchId)} completed with ${processedRecords} processed and ${failedRecords} failed.`,
    batchId,
    metadata: { incidentsCreated, duplicatesFound, executionMode: "agent_graph_background" }
  });

  return { processedRecords, failedRecords, incidentsCreated, duplicatesFound };
}
