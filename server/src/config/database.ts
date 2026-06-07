import mongoose from "mongoose";

const DEFAULT_DB_NAME = "crisisweave_db";

// "atlas" when connected to MONGODB_URI, "in-memory" when we fell back to a temporary local MongoDB.
let databaseMode: "atlas" | "in-memory" = "atlas";

export async function connectDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;

  mongoose.set("strictQuery", true);

  if (uri) {
    try {
      // autoIndex stays on so the 2dsphere index used by duplicate detection always exists.
      return await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Could not reach MONGODB_URI (${message}). Falling back to an in-memory database.`);
    }
  } else {
    console.warn("MONGODB_URI is not set. Using an in-memory database.");
  }

  // Fallback: start a throwaway MongoDB inside this process so the app still runs.
  // Data is lost when the server restarts, which is fine for a demo.
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const memoryServer = await MongoMemoryServer.create();
  databaseMode = "in-memory";
  return mongoose.connect(memoryServer.getUri(), { dbName });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function getDatabaseState(): string {
  return mongoose.STATES[mongoose.connection.readyState] ?? "unknown";
}

export function getDatabaseMode(): string {
  return databaseMode;
}
