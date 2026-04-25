import type { NextFunction, Request, Response } from "express";
import { resetAndSeedDemoData } from "../services/admin.service";
import { seedDatabase } from "../services/seed.service";

export async function seedDemo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await seedDatabase();
    res.json({ ok: true, message: "Demo users and Hyderabad resources seeded." });
  } catch (error) {
    next(error);
  }
}

export async function resetDemo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await resetAndSeedDemoData();
    res.json({ ok: true, message: "Demo data reset and seed data recreated." });
  } catch (error) {
    next(error);
  }
}
