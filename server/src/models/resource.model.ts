import { model, Schema, Types } from "mongoose";
import {
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  type ResourceStatus,
  type ResourceType
} from "../utils/enums";
import { toGeoPoint, type GeoPoint } from "../utils/geo";

export interface ResourceDocument {
  _id: Types.ObjectId;
  resourceCode: string;
  name: string;
  resourceType: ResourceType;
  status: ResourceStatus;
  currentLatitude: number;
  currentLongitude: number;
  currentLocation?: GeoPoint;
  baseLocationText?: string;
  baseLatitude?: number;
  baseLongitude?: number;
  baseLocation?: GeoPoint;
  assignedIncidentId?: Types.ObjectId;
  capacity?: number;
  capabilities: string[];
  lastStatusUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Resources represent dispatchable city response units and their current operational state.
const resourceSchema = new Schema<ResourceDocument>(
  {
    resourceCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    resourceType: { type: String, enum: RESOURCE_TYPES, required: true },
    status: { type: String, enum: RESOURCE_STATUSES, default: "AVAILABLE", required: true },
    currentLatitude: { type: Number, required: true, min: -90, max: 90 },
    currentLongitude: { type: Number, required: true, min: -180, max: 180 },
    currentLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }
    },
    baseLocationText: { type: String, trim: true },
    baseLatitude: { type: Number, min: -90, max: 90 },
    baseLongitude: { type: Number, min: -180, max: 180 },
    baseLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }
    },
    assignedIncidentId: { type: Schema.Types.ObjectId, ref: "Incident" },
    capacity: { type: Number, min: 0 },
    capabilities: [{ type: String, trim: true }],
    lastStatusUpdatedAt: { type: Date, default: Date.now }
  },
  {
    collection: "resources",
    timestamps: true
  }
);

resourceSchema.pre("validate", function syncResourceLocations(next) {
  this.currentLocation = toGeoPoint(this.currentLatitude, this.currentLongitude);
  this.baseLocation = toGeoPoint(this.baseLatitude, this.baseLongitude);
  next();
});

resourceSchema.index({ resourceType: 1 });
resourceSchema.index({ status: 1 });
resourceSchema.index({ assignedIncidentId: 1 });
resourceSchema.index({ currentLocation: "2dsphere" });

export const Resource = model<ResourceDocument>("Resource", resourceSchema);
