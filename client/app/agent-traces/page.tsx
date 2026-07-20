"use client";

// Agent traces grouped by graph run: one run = one call going through the seven agents.
import { useMemo, useState } from "react";
import type { ApiListResponse } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { traceProvider } from "../../lib/traceText";
import { usePolling } from "../../lib/usePolling";
import { AGENTS, agentLabel } from "../../components/AgentChain";
import { IncidentLink } from "../../components/DataTable";
import { TraceStep, type Trace } from "../../components/TraceStep";
import { EmptyState, ErrorState, LoadingBlock, PageHeader } from "../../components/ui";

export default function AgentTracesPage() {
  const [agent, setAgent] = useState("");
  const query = agent ? `&agentName=${agent}` : "";
  const { data, error, loading, reload } = usePolling<ApiListResponse<Trace>>(`/agent-traces?limit=100${query}`);
  const [openRun, setOpenRun] = useState<string | null>(null);

  // API returns newest first; group into runs and show each run's steps in order.
  const runs = useMemo(() => {
    const groups = new Map<string, Trace[]>();
    for (const trace of data?.items || []) {
      groups.set(trace.graphRunId, [...(groups.get(trace.graphRunId) || []), trace]);
    }
    return [...groups.entries()].map(([runId, steps]) => ({
      runId,
      steps: steps.sort((a, b) => a.stepIndex - b.stepIndex),
      incidentId: steps.find((step) => step.incidentId)?.incidentId,
      startedAt: steps[0]?.createdAt
    }));
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Agent traces"
        description="Every decision the agents made, with their reasoning. Each card is one call going through the pipeline. Tags show whether Groq or the rule-based fallback made the call."
        actions={data ? <span className="eyebrow self-end">{data.pagination.total} steps</span> : null}
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[{ name: "", label: "All agents" }, ...AGENTS].map((item) => (
          <button
            key={item.name || "all"}
            onClick={() => setAgent(item.name)}
            className={`h-7 rounded border px-2.5 text-xs transition-colors ${
              agent === item.name ? "border-slate bg-slate text-white" : "border-rule bg-surface text-slate hover:border-slate/40"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading && !error ? <LoadingBlock /> : null}
      {data && runs.length === 0 ? (
        <div className="panel">
          <EmptyState title="No agent runs yet" hint="Upload some calls and the agents' reasoning will appear here." />
        </div>
      ) : null}

      <div className="space-y-3">
        {runs.map((run) => {
          const open = openRun === run.runId || (openRun === null && run === runs[0]);
          const llmSteps = run.steps.filter((step) => traceProvider(step) !== "rules").length;
          return (
            <div key={run.runId} className="panel">
              <button
                onClick={() => setOpenRun(open ? "" : run.runId)}
                className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-paper/50 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-xs text-slate">{run.runId}</span>
                  <span className="text-xs text-muted">{formatDate(run.startedAt)}</span>
                  <span className="text-xs text-muted">
                    {llmSteps}/{run.steps.length} steps reasoned by LLM
                  </span>
                </div>
                <ol className="flex flex-wrap gap-1">
                  {run.steps.map((step) => (
                    <li
                      key={step._id}
                      className={`rounded border px-1.5 py-0.5 text-[11px] ${
                        step.retryAttempt ? "border-high/40 text-high" : "border-rule text-slate"
                      }`}
                    >
                      {agentLabel(step.agentName)}
                    </li>
                  ))}
                </ol>
              </button>
              {open ? (
                <div className="border-t border-rule px-4 pt-4">
                  {run.incidentId ? (
                    <p className="mb-4 text-xs text-muted">
                      Incident <IncidentLink id={run.incidentId} />
                    </p>
                  ) : null}
                  <ol>
                    {run.steps.map((step, index) => (
                      <TraceStep key={step._id} trace={step} last={index === run.steps.length - 1} />
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
