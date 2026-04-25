import bcrypt from "bcryptjs";
import { Resource, User } from "../models";

const demoResources = [
  {
    resourceCode: "AMB-001",
    name: "Apollo Jubilee Ambulance 1",
    resourceType: "AMBULANCE",
    status: "AVAILABLE",
    currentLatitude: 17.4326,
    currentLongitude: 78.4071,
    baseLocationText: "Jubilee Hills, Hyderabad",
    baseLatitude: 17.4326,
    baseLongitude: 78.4071,
    capacity: 2,
    capabilities: ["basic_life_support", "trauma_response"]
  },
  {
    resourceCode: "AMB-002",
    name: "KIMS Secunderabad Ambulance 2",
    resourceType: "AMBULANCE",
    status: "AVAILABLE",
    currentLatitude: 17.4449,
    currentLongitude: 78.4983,
    baseLocationText: "Secunderabad, Hyderabad",
    baseLatitude: 17.4449,
    baseLongitude: 78.4983,
    capacity: 2,
    capabilities: ["cardiac_response", "oxygen_support"]
  },
  {
    resourceCode: "AMB-003",
    name: "Gachibowli Emergency Ambulance 3",
    resourceType: "AMBULANCE",
    status: "AVAILABLE",
    currentLatitude: 17.4401,
    currentLongitude: 78.3489,
    baseLocationText: "Gachibowli, Hyderabad",
    baseLatitude: 17.4401,
    baseLongitude: 78.3489,
    capacity: 2,
    capabilities: ["trauma_response", "stroke_response"]
  },
  {
    resourceCode: "AMB-004",
    name: "Charminar Medical Response 4",
    resourceType: "AMBULANCE",
    status: "AVAILABLE",
    currentLatitude: 17.3616,
    currentLongitude: 78.4747,
    baseLocationText: "Charminar, Hyderabad",
    baseLatitude: 17.3616,
    baseLongitude: 78.4747,
    capacity: 2,
    capabilities: ["basic_life_support"]
  },
  {
    resourceCode: "AMB-005",
    name: "Kukatpally Ambulance 5",
    resourceType: "AMBULANCE",
    status: "AVAILABLE",
    currentLatitude: 17.4948,
    currentLongitude: 78.3996,
    baseLocationText: "Kukatpally, Hyderabad",
    baseLatitude: 17.4948,
    baseLongitude: 78.3996,
    capacity: 2,
    capabilities: ["trauma_response"]
  },
  {
    resourceCode: "FIRE-001",
    name: "Madhapur Fire Engine 1",
    resourceType: "FIRE_TRUCK",
    status: "AVAILABLE",
    currentLatitude: 17.4483,
    currentLongitude: 78.3915,
    baseLocationText: "Madhapur Fire Station",
    baseLatitude: 17.4483,
    baseLongitude: 78.3915,
    capacity: 6,
    capabilities: ["fire_suppression", "ladder", "rescue"]
  },
  {
    resourceCode: "FIRE-002",
    name: "Secunderabad Fire Engine 2",
    resourceType: "FIRE_TRUCK",
    status: "AVAILABLE",
    currentLatitude: 17.4399,
    currentLongitude: 78.4983,
    baseLocationText: "Secunderabad Fire Station",
    baseLatitude: 17.4399,
    baseLongitude: 78.4983,
    capacity: 6,
    capabilities: ["fire_suppression", "gas_leak_support"]
  },
  {
    resourceCode: "FIRE-003",
    name: "Old City Fire Engine 3",
    resourceType: "FIRE_TRUCK",
    status: "AVAILABLE",
    currentLatitude: 17.3713,
    currentLongitude: 78.4804,
    baseLocationText: "Old City Fire Station",
    baseLatitude: 17.3713,
    baseLongitude: 78.4804,
    capacity: 6,
    capabilities: ["fire_suppression", "ladder"]
  },
  {
    resourceCode: "FIRE-004",
    name: "Kukatpally Fire Engine 4",
    resourceType: "FIRE_TRUCK",
    status: "AVAILABLE",
    currentLatitude: 17.4933,
    currentLongitude: 78.3915,
    baseLocationText: "Kukatpally Fire Station",
    baseLatitude: 17.4933,
    baseLongitude: 78.3915,
    capacity: 6,
    capabilities: ["fire_suppression", "industrial_fire"]
  },
  {
    resourceCode: "FIRE-005",
    name: "LB Nagar Fire Engine 5",
    resourceType: "FIRE_TRUCK",
    status: "AVAILABLE",
    currentLatitude: 17.3457,
    currentLongitude: 78.5522,
    baseLocationText: "LB Nagar Fire Station",
    baseLatitude: 17.3457,
    baseLongitude: 78.5522,
    capacity: 6,
    capabilities: ["fire_suppression", "rescue"]
  },
  {
    resourceCode: "POL-001",
    name: "Banjara Hills Police Patrol 1",
    resourceType: "POLICE",
    status: "AVAILABLE",
    currentLatitude: 17.414,
    currentLongitude: 78.4343,
    baseLocationText: "Banjara Hills Police Station",
    baseLatitude: 17.414,
    baseLongitude: 78.4343,
    capacity: 4,
    capabilities: ["crowd_control", "crime_response"]
  },
  {
    resourceCode: "POL-002",
    name: "HITEC City Police Patrol 2",
    resourceType: "POLICE",
    status: "AVAILABLE",
    currentLatitude: 17.4504,
    currentLongitude: 78.3808,
    baseLocationText: "HITEC City Police Outpost",
    baseLatitude: 17.4504,
    baseLongitude: 78.3808,
    capacity: 4,
    capabilities: ["traffic_control", "crime_response"]
  },
  {
    resourceCode: "POL-003",
    name: "Charminar Police Patrol 3",
    resourceType: "POLICE",
    status: "AVAILABLE",
    currentLatitude: 17.3616,
    currentLongitude: 78.4747,
    baseLocationText: "Charminar Police Station",
    baseLatitude: 17.3616,
    baseLongitude: 78.4747,
    capacity: 4,
    capabilities: ["crime_response", "crowd_control"]
  },
  {
    resourceCode: "POL-004",
    name: "Kukatpally Police Patrol 4",
    resourceType: "POLICE",
    status: "AVAILABLE",
    currentLatitude: 17.4948,
    currentLongitude: 78.3996,
    baseLocationText: "Kukatpally Police Station",
    baseLatitude: 17.4948,
    baseLongitude: 78.3996,
    capacity: 4,
    capabilities: ["traffic_control", "crime_response"]
  },
  {
    resourceCode: "RES-001",
    name: "Musi Rescue Team 1",
    resourceType: "RESCUE_TEAM",
    status: "AVAILABLE",
    currentLatitude: 17.385,
    currentLongitude: 78.4867,
    baseLocationText: "Musi River Rescue Hub",
    baseLatitude: 17.385,
    baseLongitude: 78.4867,
    capacity: 8,
    capabilities: ["flood_rescue", "collapse_response", "evacuation"]
  },
  {
    resourceCode: "RES-002",
    name: "Gachibowli Rescue Team 2",
    resourceType: "RESCUE_TEAM",
    status: "AVAILABLE",
    currentLatitude: 17.4401,
    currentLongitude: 78.3489,
    baseLocationText: "Gachibowli Rescue Hub",
    baseLatitude: 17.4401,
    baseLongitude: 78.3489,
    capacity: 8,
    capabilities: ["collapse_response", "evacuation"]
  },
  {
    resourceCode: "RES-003",
    name: "Secunderabad Rescue Team 3",
    resourceType: "RESCUE_TEAM",
    status: "AVAILABLE",
    currentLatitude: 17.4449,
    currentLongitude: 78.4983,
    baseLocationText: "Secunderabad Rescue Hub",
    baseLatitude: 17.4449,
    baseLongitude: 78.4983,
    capacity: 8,
    capabilities: ["flood_rescue", "urban_search"]
  },
  {
    resourceCode: "UTIL-001",
    name: "TSSPDCL Utility Crew 1",
    resourceType: "UTILITY_TEAM",
    status: "AVAILABLE",
    currentLatitude: 17.4065,
    currentLongitude: 78.4772,
    baseLocationText: "Hyderabad Utility Yard",
    baseLatitude: 17.4065,
    baseLongitude: 78.4772,
    capacity: 5,
    capabilities: ["power_failure", "gas_leak_support"]
  },
  {
    resourceCode: "UTIL-002",
    name: "Cyberabad Utility Crew 2",
    resourceType: "UTILITY_TEAM",
    status: "AVAILABLE",
    currentLatitude: 17.4435,
    currentLongitude: 78.3772,
    baseLocationText: "Cyberabad Utility Yard",
    baseLatitude: 17.4435,
    baseLongitude: 78.3772,
    capacity: 5,
    capabilities: ["power_failure", "transformer_repair"]
  },
  {
    resourceCode: "ANR-001",
    name: "Hyderabad Animal Rescue Unit 1",
    resourceType: "ANIMAL_RESCUE",
    status: "AVAILABLE",
    currentLatitude: 17.4126,
    currentLongitude: 78.4094,
    baseLocationText: "Jubilee Hills Animal Rescue Center",
    baseLatitude: 17.4126,
    baseLongitude: 78.4094,
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
