import type { NextFunction, Request, Response } from "express";
import { AgentTrace, Alert, Dispatch, Incident, IncomingCall, Resource } from "../models";
import { listDocuments, listModels } from "../services/query.service";

export function createListHandler(modelName: keyof typeof listModels) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await listDocuments(listModels[modelName], req);
      res.json({ ok: true, ...result });
    } catch (error) {
      next(error);
    }
  };
}

export async function incidentDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const incident = await Incident.findById(req.params.id).lean();

    if (!incident) {
      res.status(404).json({ ok: false, message: "Incident not found." });
      return;
    }

    const [incomingCalls, assignedResources, dispatches, alerts] = await Promise.all([
      IncomingCall.find({ linkedIncidentId: incident._id }).sort({ createdAt: -1 }).lean(),
      Resource.find({ _id: { $in: incident.assignedResourceIds || [] } }).lean(),
      Dispatch.find({ incidentId: incident._id }).sort({ createdAt: -1 }).lean(),
      Alert.find({ incidentId: incident._id }).sort({ createdAt: -1 }).lean()
    ]);

    res.json({
      ok: true,
      data: {
        incident,
        incomingCalls,
        assignedResources,
        dispatches,
        alerts,
        agentTraces: await AgentTrace.find({ incidentId: incident._id }).sort({ stepIndex: 1 }).lean()
      }
    });
  } catch (error) {
    next(error);
  }
}
