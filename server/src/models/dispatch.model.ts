import { model, Schema, Types } from "mongoose";
import {
  DISPATCH_STATUSES,
  RESOURCE_TYPES,
  SEVERITIES,
  type DispatchStatus,
  type ResourceType,
  type Severity
} from "../utils/enums";

export interface DispatchDocument {
  _id: Types.ObjectId;
  dispatchCode: string;
  incidentId: Types.ObjectId;
  resourceId: Types.ObjectId;
  resourceType: ResourceType;
  incidentSeverity: Severity;
  decisionReason: string;
  distanceKm: number;
  estimatedArrivalMinutes: number;
  routeSummary?: string;
  status: DispatchStatus;
  dispatchedAt: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Dispatches store the selected unit, decision rationale, and demo routing outputs for an incident.
const dispatchSchema = new Schema<DispatchDocument>(
  {
    dispatchCode: { type: String, required: true, unique: true, trim: true },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
    resourceId: { type: Schema.Types.ObjectId, ref: "Resource", required: true },
    resourceType: { type: String, enum: RESOURCE_TYPES, required: true },
    incidentSeverity: { type: String, enum: SEVERITIES, required: true },
    decisionReason: { type: String, required: true },
    distanceKm: { type: Number, required: true, min: 0 },
    estimatedArrivalMinutes: { type: Number, required: true, min: 0 },
    routeSummary: { type: String },
    status: { type: String, enum: DISPATCH_STATUSES, default: "ASSIGNED", required: true },
    dispatchedAt: { type: Date, default: Date.now },
    arrivedAt: { type: Date },
    completedAt: { type: Date }
  },
  {
    collection: "dispatches",
    timestamps: true
  }
);

dispatchSchema.index({ dispatchCode: 1 }, { unique: true });
dispatchSchema.index({ incidentId: 1 });
dispatchSchema.index({ resourceId: 1 });
dispatchSchema.index({ status: 1 });
dispatchSchema.index({ dispatchedAt: 1 });

export const Dispatch = model<DispatchDocument>("Dispatch", dispatchSchema);
