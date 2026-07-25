"use client";

// Incident detail: everything about one incident on one page. The calls that
// reported it, the agent run that handled it, the units sent and the alerts raised.
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDate, formatTime, humanize } from "../../../lib/format";
import { liveEtaText } from "../../../lib/liveEta";
import { usePolling } from "../../../lib/usePolling";
import { Badge } from "../../../components/Badge";
import { CityMap } from "../../../components/CityMap";
import { Code } from "../../../components/DataTable";
import { TraceStep, type Trace } from "../../../components/TraceStep";
import { EmptyState, ErrorState, LoadingBlock, Panel } from "../../../components/ui";

type Detail = {
  incident: any;
  incomingCalls: any[];
  assignedResources: any[];
  dispatches: any[];
  alerts: any[];
  agentTraces: Trace[];
};

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, error, reload } = usePolling<{ ok: boolean; data: Detail }>(`/incidents/${params.id}`);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <LoadingBlock rows={10} />;

  const { incident, incomingCalls, assignedResources, dispatches, alerts, agentTraces } = data.data;

  // Group steps by graph run (one run per call), keeping the order they happened in.
  const runs: Trace[][] = [];
  for (const trace of agentTraces) {
    const run = runs.find((steps) => steps[0].graphRunId === trace.graphRunId);
    if (run) run.push(trace);
    else runs.push([trace]);
  }

  return (
    <div>
      <Link href="/incidents" className="text-xs text-muted hover:text-ink">
        ← Incidents
      </Link>

      <div className="mb-6 mt-2 border-b border-rule pb-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Code>{incident.incidentCode}</Code>
          <Badge value={incident.severity} />
          <Badge value={incident.status} />
        </div>
        <h1 className="mt-2 text-[22px] font-semibold tracking-tight">{incident.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {humanize(incident.incidentType)} · {incident.locationText || incident.city || "Unknown location"} · first
          reported {formatDate(incident.firstReportedAt || incident.createdAt)}
        </p>
      </div>

      <div className="panel mb-5 grid grid-cols-2 sm:grid-cols-4">
        <Fact label="Priority" value={incident.priorityScore} />
        <Fact label="Calls about it" value={incomingCalls.length} />
        <Fact label="Units sent" value={assignedResources.length} />
        <Fact label="Alerts raised" value={alerts.length} />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel title="How the agents handled it">
            {runs.length ? (
              <div className="space-y-6">
                {runs.map((run, runIndex) => (
                  <div key={run[0].graphRunId}>
                    {/* Every call about this incident gets its own run; later ones usually stop at Dedup. */}
                    {runs.length > 1 ? (
                      <p className="eyebrow mb-3">
                        Call {runIndex + 1} · {runIndex === 0 ? "created the incident" : "merged as a duplicate"}
                      </p>
                    ) : null}
                    <ol>
                      {run.map((trace, index) => (
                        <TraceStep key={trace._id} trace={trace} last={index === run.length - 1} />
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No agent steps recorded" />
            )}
          </Panel>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Panel title="Location" flush>
            <CityMap incidents={[incident]} resources={assignedResources} height={240} />
          </Panel>

          <Panel title={`Calls (${incomingCalls.length})`} flush>
            <ul>
              {incomingCalls.map((call) => (
                <li key={call._id} className="border-b border-rule/70 px-4 py-3 last:border-0">
                  <p className="text-[13px] leading-relaxed text-ink">&ldquo;{call.rawTranscript}&rdquo;</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{call.callerName || "Anonymous caller"}</span>
                    <span>·</span>
                    <span className="font-mono">{call.startTime || formatTime(call.createdAt)}</span>
                    {call.isDuplicate ? <Badge value="DUPLICATE" /> : null}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Dispatched units" flush>
            {dispatches.length ? (
              <ul>
                {dispatches.map((dispatch) => {
                  const unit = assignedResources.find((resource) => resource._id === dispatch.resourceId);
                  return (
                    <li key={dispatch._id} className="border-b border-rule/70 px-4 py-3 last:border-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium">{unit?.name || humanize(dispatch.resourceType)}</span>
                        <span className="whitespace-nowrap font-mono text-xs text-teal-dark">
                          {liveEtaText(dispatch.dispatchedAt, dispatch.estimatedArrivalMinutes)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {humanize(dispatch.resourceType)} · {dispatch.distanceKm} km · <Code>{dispatch.dispatchCode}</Code>
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate">{dispatch.decisionReason}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="No units dispatched" hint="No matching unit was free when this incident came in." />
            )}
          </Panel>

          <Panel title="Alerts" flush>
            {alerts.length ? (
              <ul>
                {alerts.map((alert) => (
                  <li key={alert._id} className="flex items-start justify-between gap-3 border-b border-rule/70 px-4 py-3 last:border-0">
                    <div>
                      <p className="text-sm">{alert.targetOrganization}</p>
                      <p className="text-xs text-muted">{humanize(alert.alertType)}</p>
                    </div>
                    <Badge value={alert.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No alerts raised" />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-r border-rule px-4 py-3 last:border-r-0">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-mono text-xl tabular-nums">{value ?? "-"}</p>
    </div>
  );
}
