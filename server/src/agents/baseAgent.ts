import type { Types } from "mongoose";
import { AgentTrace } from "../models";
import type { AgentName } from "../utils/enums";

export interface AgentContext {
  graphRunId: string;
  batchId?: Types.ObjectId;
  incomingCallId?: Types.ObjectId;
  incidentId?: Types.ObjectId;
  retryAttempt?: number;
  nextStep: () => number;
}

export interface AgentResult<TOutput extends Record<string, unknown>> {
  output: TOutput;
  reasoning: string;
  decision: string;
  critique?: string;
}

export abstract class BaseAgent<TInput extends Record<string, unknown>, TOutput extends Record<string, unknown>> {
  abstract readonly name: AgentName;
  abstract readonly goal: string;

  async run(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>> {
    const result = await this.reason(input, context);

    await AgentTrace.create({
      graphRunId: context.graphRunId,
      stepIndex: context.nextStep(),
      retryAttempt: context.retryAttempt || 0,
      agentName: this.name,
      goal: this.goal,
      input,
      output: result.output,
      reasoning: result.reasoning,
      decision: result.decision,
      critique: result.critique,
      batchId: context.batchId,
      incomingCallId: context.incomingCallId,
      incidentId: context.incidentId
    });

    return result;
  }

  protected abstract reason(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>>;
}
