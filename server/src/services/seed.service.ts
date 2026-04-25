import bcrypt from "bcryptjs";
import { Resource, User } from "../models";

const demoResources = [
  {
    resourceCode: "AMB-001",
    name: "Central Ambulance Unit 1",
    resourceType: "AMBULANCE",
    status: "AVAILABLE",
    currentLatitude: 12.9716,
    currentLongitude: 77.5946,
    baseLocationText: "Central City Hospital",
    baseLatitude: 12.9716,
    baseLongitude: 77.5946,
    capacity: 2,
    capabilities: ["basic_life_support", "trauma_response"]
  },
  {
    resourceCode: "FIRE-001",
    name: "Downtown Fire Engine 1",
    resourceType: "FIRE_TRUCK",
    status: "AVAILABLE",
    currentLatitude: 12.9758,
    currentLongitude: 77.605,
    baseLocationText: "Downtown Fire Station",
    baseLatitude: 12.9758,
    baseLongitude: 77.605,
    capacity: 6,
    capabilities: ["fire_suppression", "ladder", "rescue"]
  },
  {
    resourceCode: "POL-001",
    name: "Metro Police Patrol 1",
    resourceType: "POLICE",
    status: "AVAILABLE",
    currentLatitude: 12.9667,
    currentLongitude: 77.587,
    baseLocationText: "Metro Police Station",
    baseLatitude: 12.9667,
    baseLongitude: 77.587,
    capacity: 4,
    capabilities: ["crowd_control", "crime_response"]
  },
  {
    resourceCode: "RES-001",
    name: "Urban Rescue Team 1",
    resourceType: "RESCUE_TEAM",
    status: "AVAILABLE",
    currentLatitude: 12.98,
    currentLongitude: 77.58,
    baseLocationText: "Urban Search and Rescue Hub",
    baseLatitude: 12.98,
    baseLongitude: 77.58,
    capacity: 8,
    capabilities: ["flood_rescue", "collapse_response", "evacuation"]
  },
  {
    resourceCode: "UTIL-001",
    name: "Grid Utility Crew 1",
    resourceType: "UTILITY_TEAM",
    status: "AVAILABLE",
    currentLatitude: 12.969,
    currentLongitude: 77.61,
    baseLocationText: "City Utility Yard",
    baseLatitude: 12.969,
    baseLongitude: 77.61,
    capacity: 5,
    capabilities: ["power_failure", "gas_leak_support"]
  },
  {
    resourceCode: "ANR-001",
    name: "Animal Rescue Unit 1",
    resourceType: "ANIMAL_RESCUE",
    status: "AVAILABLE",
    currentLatitude: 12.955,
    currentLongitude: 77.59,
    baseLocationText: "Animal Care Response Center",
    baseLatitude: 12.955,
    baseLongitude: 77.59,
    capacity: 3,
    capabilities: ["missing_pet", "animal_evacuations"]
  }
] as const;

export async function seedDatabase(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@crisisweave.local";
  const staffEmail = process.env.SEED_STAFF_EMAIL || "staff@crisisweave.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "change-me-admin-password";
  const staffPassword = process.env.SEED_STAFF_PASSWORD || "change-me-staff-password";

  await Promise.all(
    demoResources.map((resource) =>
      Resource.updateOne(
        { resourceCode: resource.resourceCode },
        { $set: { ...resource, lastStatusUpdatedAt: new Date() } },
        { upsert: true }
      )
    )
  );

  const [adminHash, staffHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(staffPassword, 10)
  ]);

  await User.updateOne(
    { email: adminEmail },
    {
      $set: {
        name: "CrisisWeave Admin",
        email: adminEmail,
        role: "ADMIN",
        passwordHash: adminHash,
        status: "ACTIVE"
      }
    },
    { upsert: true }
  );

  await User.updateOne(
    { email: staffEmail },
    {
      $set: {
        name: "CrisisWeave Staff",
        email: staffEmail,
        role: "STAFF",
        passwordHash: staffHash,
        status: "ACTIVE"
      }
    },
    { upsert: true }
  );
}
