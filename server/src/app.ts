import cors from "cors";
import express from "express";
import helmet from "helmet";
import { apiRouter } from "./routes/api.routes";
import { getDatabaseHealth } from "./services/databaseHealth.service";

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "crisisweave-server" });
  });

  app.get("/health/database", async (_req, res, next) => {
    try {
      const health = await getDatabaseHealth();
      res.status(health.ok ? 200 : 503).json(health);
    } catch (error) {
      next(error);
    }
  });

  app.use("/api", apiRouter);

  app.use(
    (
      error: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      res.status(500).json({
        ok: false,
        message: error.message
      });
    }
  );

  return app;
}
