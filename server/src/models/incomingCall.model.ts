import { model, Schema, Types } from "mongoose";
import { CALL_PROCESSING_STATUSES, type CallProcessingStatus } from "../utils/enums";
import { toGeoPoint, type GeoPoint } from "../utils/geo";

export interface IncomingCallDocument {
  _id: Types.ObjectId;
  batchId: Types.ObjectId;
  rawTranscript: string;
  callerName?: string;
  callerPhone?: string;
  sourceId?: string;
  callDate?: Date;
  startTime?: string;
  endTime?: string;
  locationText?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  location?: GeoPoint;
  extractedData?: Record<string, unknown>;
  linkedIncidentId?: Types.ObjectId;
  isDuplicate: boolean;
  duplicateOfIncidentId?: Types.ObjectId;
  processingStatus: CallProcessingStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Incoming calls preserve every raw uploaded transcript, including duplicates, before AI extraction.
const incomingCallSchema = new Schema<IncomingCallDocument>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "UploadBatch", required: true },
    rawTranscript: { type: String, required: true },
    callerName: { type: String, trim: true },
    callerPhone: { type: String, trim: true },
    sourceId: { type: String, trim: true },
    callDate: { type: Date },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    locationText: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }
    },
    extractedData: { type: Schema.Types.Mixed, default: {} },
    linkedIncidentId: { type: Schema.Types.ObjectId, ref: "Incident" },
    isDuplicate: { type: Boolean, default: false },
    duplicateOfIncidentId: { type: Schema.Types.ObjectId, ref: "Incident" },
    processingStatus: {
      type: String,
      enum: CALL_PROCESSING_STATUSES,
      default: "PENDING",
      required: true
    },
    errorMessage: { type: String }
  },
  {
    collection: "incoming_calls",
    timestamps: true
  }
);

incomingCallSchema.pre("validate", function syncIncomingCallLocation(next) {
  this.location = toGeoPoint(this.latitude, this.longitude);
  next();
});

incomingCallSchema.index({ batchId: 1 });
incomingCallSchema.index({ processingStatus: 1 });
incomingCallSchema.index({ linkedIncidentId: 1 });
incomingCallSchema.index({ callDate: 1 });
incomingCallSchema.index({ location: "2dsphere" }, { sparse: true });

export const IncomingCall = model<IncomingCallDocument>("IncomingCall", incomingCallSchema);
