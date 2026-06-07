import "dotenv/config";
import { createApp } from "./app";
import { connectDatabase, getDatabaseMode } from "./config/database";
import { Resource } from "./models";
import { seedDatabase } from "./services/seed.service";

const port = Number(process.env.PORT || 4000);

async function startServer(): Promise<void> {
  await connectDatabase();
  console.log(`Database connected (${getDatabaseMode()}).`);

  // A fresh database has no response units, so seed the Hyderabad fleet automatically.
  if ((await Resource.estimatedDocumentCount()) === 0) {
    await seedDatabase();
    console.log("Empty database: seeded Hyderabad demo resources.");
  }

  const app = createApp();
  app.listen(port, () => {
    console.log(`CrisisWeave server listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start CrisisWeave server:", error);
  process.exit(1);
});
