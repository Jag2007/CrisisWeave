import { model, Schema, Types } from "mongoose";
import {
  ALERT_STATUSES,
  ALERT_TYPES,
  SEVERITIES,
  type AlertStatus,
  type AlertType,
  type Severity
} from "../utils/enums";

export interface AlertDocument {
  _id: Types.ObjectId;
  alertCode: string;
  incidentId: Types.ObjectId;
  alertType: AlertType;
  targetOrganization: string;
  message: string;
  severity: Severity;
  status: AlertStatus;
  generatedAt: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Alerts are simulated records for demo visibility; they do not send real SMS, calls, or email.
const alertSchema = new Schema<AlertDocument>(
  {
    alertCode: { type: String, required: true, unique: true, trim: true },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident", required: true },
    alertType: { type: String, enum: ALERT_TYPES, required: true },
    targetOrganization: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    severity: { type: String, enum: SEVERITIES, required: true },
    status: { type: String, enum: ALERT_STATUSES, default: "PENDING", required: true },
    generatedAt: { type: Date, default: Date.now },
    sentAt: { type: Date }
  },
  {
    collection: "alerts",
    timestamps: true
  }
);

alertSchema.index({ incidentId: 1 });
alertSchema.index({ alertType: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ generatedAt: 1 });

export const Alert = model<AlertDocument>("Alert", alertSchema);
