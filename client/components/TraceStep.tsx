// One agent step from the execution graph: what it decided, why, and who reasoned it.
import { friendlyTraceText, traceProvider } from "../lib/traceText";
import { agentLabel } from "./AgentChain";

export type Trace = {
  _id: string;
  graphRunId: string;
  stepIndex: number;
  retryAttempt?: number;
  agentName: string;
  goal: string;
  input?: unknown;
  output?: unknown;
  reasoning: string;
  decision: string;
  critique?: string;
  provider?: string;
  incidentId?: string;
  createdAt: string;
};

const providerStyle = {
  groq: "border-teal/30 bg-teal-soft text-teal-dark",
  openai: "border-slate/20 bg-paper text-slate",
  rules: "border-medium/30 bg-[#fbf5e2] text-[#7a5c00]"
};

export function TraceStep({ trace, last }: { trace: Trace; last?: boolean }) {
  const provider = traceProvider(trace);
  // The critique field doubles as "who reasoned this"; only show it when it says something more.
  const critique = trace.critique && !/^reasoning provider/i.test(trace.critique) ? friendlyTraceText(trace.critique) : null;

  return (
    <li className="relative flex gap-4 pb-5">
      {!last ? <span className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-px bg-rule" /> : null}
      <span className="z-[1] mt-0.5 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border border-rule bg-surface font-mono text-[11px] text-slate">
        {trace.stepIndex}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">{agentLabel(trace.agentName)} agent</span>
          {trace.retryAttempt ? (
            <span className="rounded border border-high/30 bg-[#fdf0e7] px-1.5 text-[11px] text-high">retry {trace.retryAttempt}</span>
          ) : null}
          <span className={`rounded border px-1.5 font-mono text-[10px] uppercase tracking-wide ${providerStyle[provider]}`}>
            {provider}
          </span>
        </div>
        <p className="mt-1 text-[13px] font-medium leading-snug text-ink">{friendlyTraceText(trace.decision)}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{friendlyTraceText(trace.reasoning)}</p>
        {critique ? (
          <p className="mt-1.5 border-l-2 border-high/50 pl-2 text-[13px] leading-snug text-slate">{critique}</p>
        ) : null}
        {trace.output ? (
          <details className="mt-1.5 text-xs">
            <summary className="cursor-pointer select-none text-muted hover:text-ink">Input / output</summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded border border-rule bg-paper p-3 font-mono text-[11px] leading-relaxed text-slate">
              {JSON.stringify({ input: trace.input, output: trace.output }, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </li>
  );
}
