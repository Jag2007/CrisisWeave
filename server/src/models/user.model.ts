import { model, Schema, Types } from "mongoose";
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from "../utils/enums";

export interface UserDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Users provide lightweight ADMIN/STAFF ownership for uploads and dashboard access in the hackathon demo.
const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: USER_ROLES, default: "STAFF", required: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: USER_STATUSES, default: "ACTIVE", required: true }
  },
  {
    collection: "users",
    timestamps: true
  }
);

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

export const User = model<UserDocument>("User", userSchema);
