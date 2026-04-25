import { Router } from "express";
import multer from "multer";
import { resetDemo, seedDemo } from "../controllers/admin.controller";
import { dashboardSummary } from "../controllers/dashboard.controller";
import { createListHandler, incidentDetail } from "../controllers/list.controller";
import { uploadJson } from "../controllers/upload.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

export const apiRouter = Router();

apiRouter.post("/uploads/json", upload.single("file"), uploadJson);

apiRouter.get("/dashboard/summary", dashboardSummary);

apiRouter.get("/incoming-calls", createListHandler("incomingCalls"));
apiRouter.get("/incidents", createListHandler("incidents"));
apiRouter.get("/incidents/:id", incidentDetail);
apiRouter.get("/resources", createListHandler("resources"));
apiRouter.get("/dispatches", createListHandler("dispatches"));
apiRouter.get("/alerts", createListHandler("alerts"));
apiRouter.get("/system-logs", createListHandler("systemLogs"));
apiRouter.get("/upload-batches", createListHandler("uploadBatches"));

apiRouter.post("/admin/seed", seedDemo);
apiRouter.post("/admin/reset-demo-data", resetDemo);
