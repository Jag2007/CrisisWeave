import { Alert, Dispatch, Incident, IncomingCall, Resource, SystemLog, UploadBatch, User } from "../models";
import { seedDatabase } from "./seed.service";

export async function resetDemoData(): Promise<void> {
  await Promise.all([
    Alert.deleteMany({}),
    Dispatch.deleteMany({}),
    Incident.deleteMany({}),
    IncomingCall.deleteMany({}),
    Resource.deleteMany({}),
    SystemLog.deleteMany({}),
    UploadBatch.deleteMany({}),
    User.deleteMany({})
  ]);
}

export async function resetAndSeedDemoData(): Promise<void> {
  await resetDemoData();
  await seedDatabase();
}
