import { SystemLog } from "../models";
import type { SystemEventType } from "../utils/enums";

interface LogInput {
  eventType: SystemEventType;
  message: string;
  batchId?: unknown;
  incomingCallId?: unknown;
  incidentId?: unknown;
  resourceId?: unknown;
  dispatchId?: unknown;
  metadata?: Record<string, unknown>;
}

export async function writeSystemLog(input: LogInput): Promise<void> {
  await SystemLog.create(input);
}
