import { model, Schema, Types } from "mongoose";
import {
  INCIDENT_STATUSES,
  INCIDENT_TYPES,
  RESOURCE_TYPES,
  SEVERITIES,
  type IncidentStatus,
  type IncidentType,
  type ResourceType,
  type Severity
} from "../utils/enums";
import { toGeoPoint, type GeoPoint } from "../utils/geo";

export interface IncidentDocument {
  _id: Types.ObjectId;
  incidentCode: string;
  title: string;
  description?: string;
  incidentType: IncidentType;
  severity: Severity;
  priorityScore: number;
  status: IncidentStatus;
  locationText?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  location?: GeoPoint;
  requiredResourceTypes: ResourceType[];
  incomingCallIds: Types.ObjectId[];
  duplicateCount: number;
  assignedResourceIds: Types.ObjectId[];
  dispatchIds: Types.ObjectId[];
  alertIds: Types.ObjectId[];
  firstReportedAt?: Date;
  lastUpdatedFromCallAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Incidents are the deduplicated emergency records used for prioritization, dispatch, and dashboards.
const incidentSchema = new Schema<IncidentDocument>(
  {
    incidentCode: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    incidentType: { type: String, enum: INCIDENT_TYPES, required: true },
    severity: { type: String, enum: SEVERITIES, required: true },
    priorityScore: { type: Number, default: 0, min: 0, index: true },
    status: { type: String, enum: INCIDENT_STATUSES, default: "NEW", required: true },
    locationText: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }
    },
    requiredResourceTypes: [{ type: String, enum: RESOURCE_TYPES }],
    incomingCallIds: [{ type: Schema.Types.ObjectId, ref: "IncomingCall" }],
    duplicateCount: { type: Number, default: 0, min: 0 },
    assignedResourceIds: [{ type: Schema.Types.ObjectId, ref: "Resource" }],
    dispatchIds: [{ type: Schema.Types.ObjectId, ref: "Dispatch" }],
    alertIds: [{ type: Schema.Types.ObjectId, ref: "Alert" }],
    firstReportedAt: { type: Date },
    lastUpdatedFromCallAt: { type: Date }
  },
  {
    collection: "incidents",
    timestamps: true
  }
);

incidentSchema.pre("validate", function syncIncidentLocation(next) {
  this.location = toGeoPoint(this.latitude, this.longitude);
  next();
});

incidentSchema.index({ incidentCode: 1 }, { unique: true });
incidentSchema.index({ incidentType: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ createdAt: 1 });
incidentSchema.index({ location: "2dsphere" }, { sparse: true });

export const Incident = model<IncidentDocument>("Incident", incidentSchema);
