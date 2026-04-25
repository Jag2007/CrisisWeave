import { model, Schema, Types } from "mongoose";
import { AGENT_NAMES, type AgentName } from "../utils/enums";

export interface AgentTraceDocument {
  _id: Types.ObjectId;
  graphRunId: string;
  stepIndex: number;
  retryAttempt: number;
  agentName: AgentName;
  goal: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  reasoning: string;
  decision: string;
  critique?: string;
  batchId?: Types.ObjectId;
  incomingCallId?: Types.ObjectId;
  incidentId?: Types.ObjectId;
  createdAt: Date;
}

// Agent traces are the explainability memory for the graph-driven AI pipeline.
const agentTraceSchema = new Schema<AgentTraceDocument>(
  {
    graphRunId: { type: String, required: true, trim: true },
    stepIndex: { type: Number, required: true, min: 1 },
    retryAttempt: { type: Number, default: 0, min: 0 },
    agentName: { type: String, enum: AGENT_NAMES, required: true },
    goal: { type: String, required: true },
    input: { type: Schema.Types.Mixed, default: {} },
    output: { type: Schema.Types.Mixed, default: {} },
    reasoning: { type: String, required: true },
    decision: { type: String, required: true },
    critique: { type: String },
    batchId: { type: Schema.Types.ObjectId, ref: "UploadBatch" },
    incomingCallId: { type: Schema.Types.ObjectId, ref: "IncomingCall" },
    incidentId: { type: Schema.Types.ObjectId, ref: "Incident" }
  },
  {
    collection: "agent_traces",
    timestamps: { createdAt: true, updatedAt: false }
  }
);

agentTraceSchema.index({ graphRunId: 1, stepIndex: 1 });
agentTraceSchema.index({ agentName: 1 });
agentTraceSchema.index({ batchId: 1 });
agentTraceSchema.index({ incomingCallId: 1 });
agentTraceSchema.index({ incidentId: 1 });
agentTraceSchema.index({ createdAt: 1 });

export const AgentTrace = model<AgentTraceDocument>("AgentTrace", agentTraceSchema);
