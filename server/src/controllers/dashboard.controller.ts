import type { NextFunction, Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboard.service";

export async function dashboardSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ ok: true, data: await getDashboardSummary() });
  } catch (error) {
    next(error);
  }
}
