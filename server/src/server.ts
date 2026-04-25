import "dotenv/config";
import { createApp } from "./app";
import { connectDatabase } from "./config/database";

const port = Number(process.env.PORT || 4000);

async function startServer(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  app.listen(port, () => {
    console.log(`CrisisWeave server listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start CrisisWeave server:", error);
  process.exit(1);
});
