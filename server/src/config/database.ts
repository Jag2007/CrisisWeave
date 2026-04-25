import mongoose from "mongoose";

const DEFAULT_DB_NAME = "crisisweave_db";

export async function connectDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;

  if (!uri) {
    throw new Error("MONGODB_URI is required. Add it to your environment or server/.env file.");
  }

  mongoose.set("strictQuery", true);

  return mongoose.connect(uri, {
    dbName,
    autoIndex: process.env.NODE_ENV !== "production"
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function getDatabaseState(): string {
  return mongoose.STATES[mongoose.connection.readyState] ?? "unknown";
}
