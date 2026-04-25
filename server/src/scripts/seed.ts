import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { seedDatabase } from "../services/seed.service";

async function main(): Promise<void> {
  await connectDatabase();
  await seedDatabase();
  await disconnectDatabase();
  console.log("Seed complete: demo resources and users are ready.");
}

main().catch(async (error) => {
  console.error("Seed failed:", error);
  await disconnectDatabase();
  process.exit(1);
});
