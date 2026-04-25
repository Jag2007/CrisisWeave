import { model, Schema, Types } from "mongoose";
import { SYSTEM_EVENT_TYPES, type SystemEventType } from "../utils/enums";

export interface SystemLogDocument {
  _id: Types.ObjectId;
  eventType: SystemEventType;
  message: string;
  batchId?: Types.ObjectId;
  incomingCallId?: Types.ObjectId;
  incidentId?: Types.ObjectId;
  resourceId?: Types.ObjectId;
  dispatchId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// System logs explain every pipeline step during demos and support later admin/debug views.
const systemLogSchema = new Schema<SystemLogDocument>(
  {
    eventType: { type: String, enum: SYSTEM_EVENT_TYPES, required: true },
    message: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "UploadBatch" },
    incomingCallId: { type: Schema.Types.ObjectId, ref: "IncomingCall" },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident" },
    resourceId: { type: Schema.Types.ObjectId, ref: "Resource" },
    dispatchId: { type: Schema.Types.ObjectId, ref: "Dispatch" },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  {
    collection: "system_logs",
    timestamps: { createdAt: true, updatedAt: false }
  }
);

systemLogSchema.index({ eventType: 1 });
systemLogSchema.index({ batchId: 1 });
systemLogSchema.index({ incidentId: 1 });
systemLogSchema.index({ resourceId: 1 });
systemLogSchema.index({ createdAt: 1 });

export const SystemLog = model<SystemLogDocument>("SystemLog", systemLogSchema);
