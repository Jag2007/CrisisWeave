import { model, Schema, Types } from "mongoose";
import { UPLOAD_BATCH_STATUSES, type UploadBatchStatus } from "../utils/enums";

export interface UploadBatchDocument {
  _id: Types.ObjectId;
  originalFileName: string;
  uploadedBy?: Types.ObjectId;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  status: UploadBatchStatus;
  uploadSource?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Upload batches represent one uploaded JSON bundle and let the pipeline track bundle-level progress.
const uploadBatchSchema = new Schema<UploadBatchDocument>(
  {
    originalFileName: { type: String, required: true, trim: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    totalRecords: { type: Number, required: true, min: 0 },
    processedRecords: { type: Number, default: 0, min: 0 },
    failedRecords: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: UPLOAD_BATCH_STATUSES, default: "UPLOADED", required: true },
    uploadSource: { type: String, trim: true }
  },
  {
    collection: "upload_batches",
    timestamps: true
  }
);

export const UploadBatch = model<UploadBatchDocument>("UploadBatch", uploadBatchSchema);
