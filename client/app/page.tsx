"use client";

// Overview: live numbers, the city map, the priority queue and the activity feed.
import Link from "next/link";
import { useState } from "react";
import { apiPostJson, type ApiListResponse } from "../lib/api";
import { humanize, timeAgo } from "../lib/format";
import { usePolling } from "../lib/usePolling";
import { Badge } from "../components/Badge";
import { CityMap, MapLegend, type MapIncident, type MapResource } from "../components/CityMap";
import { AgentChain } from "../components/AgentChain";
import { Button, EmptyState, ErrorState, LoadingBlock, PageHeader, Panel } from "../components/ui";

type Summary = {
  totalUploadedBatches: number;
  totalIncomingCalls: number;
  totalActiveIncidents: number;
  duplicateCallsCount: number;
  incidentsBySeverity: Array<{ _id: string; count: number }>;
  incidentsByType: Array<{ _id: string; count: number }>;
  availableResources: number;
  busyResources: number;
  totalDispatches: number;
  totalAlerts: number;
  totalAgentTraces: number;
  recentSystemLogs: Array<{ _id: string; eventType: string; message: string; createdAt: string }>;
};

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const severityBar: Record<string, string> = { CRITICAL: "bg-critical", HIGH: "bg-high", MEDIUM: "bg-medium", LOW: "bg-low" };

export default function OverviewPage() {
  const summary = usePolling<{ ok: boolean; data: Summary }>("/dashboard/summary");
  const incidents = usePolling<ApiListResponse<MapIncident & { status: string; incidentType: string }>>("/incidents?limit=100");
  const resources = usePolling<ApiListResponse<MapResource>>("/resources?limit=100");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const runAdmin = async (path: string, done: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await apiPostJson(path, {});
      setNotice(done);
      await Promise.all([summary.reload(), incidents.reload(), resources.reload()]);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const resetDemo = () => {
    if (window.confirm("Clear all calls, incidents, dispatches and traces, then re-create the Hyderabad units?")) {
      void runAdmin("/admin/reset-demo-data", "Demo data cleared. Units are back at base.");
    }
  };

  if (summary.error) return <ErrorState message={summary.error} onRetry={summary.reload} />;

  const s = summary.data?.data;
  const queue = [...(incidents.data?.items || [])]
    .filter((incident) => !["RESOLVED", "CLOSED"].includes(incident.status))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 7);

  return (
    <div>
      <PageHeader
        title="Operations overview"
        description="Hyderabad emergency grid. Every call is read, merged, scored and dispatched by a chain of reasoning agents."
        actions={
          <>
            <Button onClick={() => void runAdmin("/admin/seed", "Hyderabad units seeded.")} disabled={busy}>
              Seed units
            </Button>
            <Button onClick={resetDemo} disabled={busy}>
              Reset demo
            </Button>
            <Link
              href="/upload"
              className="inline-flex h-9 items-center rounded border border-teal bg-teal px-3.5 text-sm font-medium text-white hover:bg-teal-dark"
            >
              Upload calls
            </Link>
          </>
        }
      />

      {notice ? <p className="-mt-3 mb-5 text-sm text-teal-dark">{notice}</p> : null}

      {!s ? (
        <LoadingBlock rows={8} />
      ) : (
        <div className="space-y-5">
          <div className="panel grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
            <Stat label="Active incidents" value={s.totalActiveIncidents} />
            <Stat label="Calls received" value={s.totalIncomingCalls} />
            <Stat label="Duplicates merged" value={s.duplicateCallsCount} />
            <Stat label="Units free / busy" value={`${s.availableResources} / ${s.busyResources}`} />
            <Stat label="Dispatches" value={s.totalDispatches} />
            <Stat label="Alerts sent" value={s.totalAlerts} />
            <Stat label="Agent decisions" value={s.totalAgentTraces} href="/agent-traces" />
          </div>

          <AgentChain />

          {s.totalIncomingCalls === 0 ? (
            <div className="panel">
              <EmptyState
                title="No calls processed yet"
                hint={
                  <>
                    Go to <Link href="/upload" className="text-teal underline">Upload calls</Link> and load the
                    Hyderabad sample bundle to watch the agents work.
                  </>
                }
              />
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <Panel title="City map" aside={<MapLegend />} flush>
                <CityMap incidents={incidents.data?.items || []} resources={resources.data?.items || []} />
              </Panel>
            </div>

            <Panel title="Priority queue" aside={<Link href="/incidents" className="text-xs text-teal hover:underline">All incidents</Link>} flush>
              {queue.length === 0 ? (
                <EmptyState title="Queue is clear" />
              ) : (
                <ol>
                  {queue.map((incident) => (
                    <li key={incident._id} className="border-b border-rule/70 last:border-0">
                      <Link href={`/incidents/${incident._id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-paper/60">
                        <span className="w-8 shrink-0 pt-0.5 text-right font-mono text-base font-medium tabular-nums text-ink">
                          {incident.priorityScore}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{incident.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted">{incident.locationText || "-"}</span>
                        </span>
                        <Badge value={incident.severity} />
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-3">
            <Panel title="By severity">
              <SeverityBreakdown rows={s.incidentsBySeverity} />
            </Panel>
            <Panel title="By type">
              <TypeBreakdown rows={s.incidentsByType} />
            </Panel>
            <Panel title="Activity" aside={<Link href="/system-logs" className="text-xs text-teal hover:underline">Full log</Link>} flush>
              <ul className="max-h-[260px] overflow-y-auto">
                {s.recentSystemLogs.map((log) => (
                  <li key={log._id} className="border-b border-rule/70 px-4 py-2.5 last:border-0">
                    <p className="text-[13px] leading-snug text-ink">{log.message}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted">
                      {humanize(log.eventType)} · {timeAgo(log.createdAt)}
                    </p>
                  </li>
                ))}
                {s.recentSystemLogs.length === 0 ? <EmptyState title="Nothing logged yet" /> : null}
              </ul>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const body = (
    <>
      <p className="eyebrow">{label}</p>
      <p className="mt-1.5 font-mono text-2xl font-medium tabular-nums text-ink">{value}</p>
    </>
  );
  const className = "border-b border-r border-rule px-4 py-3.5 last:border-r-0 xl:border-b-0";
  return href ? (
    <Link href={href} className={`${className} hover:bg-paper/60`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function SeverityBreakdown({ rows }: { rows: Array<{ _id: string; count: number }> }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (!total) return <p className="text-sm text-muted">No active incidents.</p>;
  const sorted = SEVERITY_ORDER.map((severity) => ({
    severity,
    count: rows.find((row) => row._id === severity)?.count || 0
  }));

  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-sm bg-paper">
        {sorted.map((row) =>
          row.count ? <div key={row.severity} className={severityBar[row.severity]} style={{ width: `${(row.count / total) * 100}%` }} /> : null
        )}
      </div>
      <dl className="mt-4 space-y-2">
        {sorted.map((row) => (
          <div key={row.severity} className="flex items-center justify-between">
            <dt>
              <Badge value={row.severity} />
            </dt>
            <dd className="font-mono text-sm tabular-nums">{row.count}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function TypeBreakdown({ rows }: { rows: Array<{ _id: string; count: number }> }) {
  if (!rows.length) return <p className="text-sm text-muted">No active incidents.</p>;
  const max = Math.max(...rows.map((row) => row.count));
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
      {rows.map((row) => (
        <li key={row._id}>
          <div className="flex justify-between text-[13px]">
            <span>{humanize(row._id)}</span>
            <span className="font-mono tabular-nums text-muted">{row.count}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-sm bg-paper">
            <div className="h-1.5 rounded-sm bg-slate/50" style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
