import type { Request } from "express";
import type { FilterQuery, Model } from "mongoose";
import { AgentTrace, Alert, Dispatch, Incident, IncomingCall, Resource, SystemLog, UploadBatch } from "../models";

const allowedFilters = new Set([
  "status",
  "severity",
  "incidentType",
  "resourceType",
  "batchId",
  "incomingCallId",
  "incidentId",
  "graphRunId",
  "agentName"
]);

export function getPagination(req: Request): { page: number; limit: number; skip: number } {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
  return { page, limit, skip: (page - 1) * limit };
}

export function getFilters(req: Request): FilterQuery<unknown> {
  const filters: FilterQuery<unknown> = {};

  for (const [key, value] of Object.entries(req.query)) {
    if (allowedFilters.has(key) && value) {
      filters[key] = value;
    }
  }

  return filters;
}

export async function listDocuments(model: Model<any>, req: Request, defaultSort: Record<string, 1 | -1> = { createdAt: -1 }) {
  const { page, limit, skip } = getPagination(req);
  const filters = getFilters(req);
  const [items, total] = await Promise.all([
    model.find(filters).sort(defaultSort).skip(skip).limit(limit).lean(),
    model.countDocuments(filters)
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export const listModels = {
  uploadBatches: UploadBatch,
  incomingCalls: IncomingCall,
  incidents: Incident,
  resources: Resource,
  dispatches: Dispatch,
  alerts: Alert,
  agentTraces: AgentTrace,
  systemLogs: SystemLog
};
