"use client";

// Incident detail page ties raw calls, agent reasoning, resources, dispatches,
// and alerts together while polling for live ETA/progress changes.
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, Skeleton } from "antd";
import { apiGet } from "../../../lib/api";
import { Badge } from "../../../components/Badge";
import { DataTable } from "../../../components/DataTable";
import { friendlyTraceText } from "../../../lib/traceText";
import { liveEtaText } from "../../../lib/liveEta";

type Detail = {
  incident: any;
  incomingCalls: any[];
  assignedResources: any[];
  dispatches: any[];
  alerts: any[];
  agentTraces: any[];
};

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastDetailSnapshot = useRef("");

  useEffect(() => {
    let active = true;

    const load = (initial = false) => {
      apiGet<{ ok: boolean; data: Detail }>(`/incidents/${params.id}`)
        .then((response) => {
          if (!active) return;
          const nextSnapshot = JSON.stringify(response.data);
          if (nextSnapshot !== lastDetailSnapshot.current) {
            lastDetailSnapshot.current = nextSnapshot;
            setDetail(response.data);
          }
          setError(null);
        })
        .catch((err) => {
          if (!active) return;
          if (initial || !lastDetailSnapshot.current) {
            setError(err instanceof Error ? err.message : "Failed to load incident");
          }
        });
    };

    load(true);
    const timer = window.setInterval(() => load(false), 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [params.id]);

  if (error) return <Alert type="error" message="Incident failed to load" description={error} showIcon />;
  if (!detail) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <Skeleton active paragraph={{ rows: 4 }} title={{ width: "45%" }} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <Skeleton active paragraph={{ rows: 8 }} title={{ width: "30%" }} />
        </div>
      </div>
    );
  }

  const incident = detail.incident;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-signal">{incident.incidentCode}</p>
            <h2 className="mt-1 text-3xl font-bold text-ink">{incident.title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{incident.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge value={incident.incidentType} />
            <Badge value={incident.severity} />
            <Badge value={incident.status} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-500">Priority</p><p className="text-xl font-bold">{incident.priorityScore}</p></div>
          <div className="rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-500">Duplicates</p><p className="text-xl font-bold">{incident.duplicateCount}</p></div>
          <div className="rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-500">Resources</p><p className="text-xl font-bold">{detail.assignedResources.length}</p></div>
          <div className="rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-500">Alerts</p><p className="text-xl font-bold">{detail.alerts.length}</p></div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-bold text-ink">Agent execution trace</h3>
        <DataTable
          rows={detail.agentTraces}
          columns={[
            { key: "step", label: "Step", render: (row: any) => `${row.stepIndex}${row.retryAttempt ? ` / retry ${row.retryAttempt}` : ""}` },
            { key: "agent", label: "Agent", render: (row: any) => <Badge value={row.agentName} /> },
            { key: "decision", label: "Decision", render: (row: any) => friendlyTraceText(row.decision) },
            { key: "reasoning", label: "Reasoning", render: (row: any) => friendlyTraceText(row.reasoning) },
            { key: "critique", label: "Critique", render: (row: any) => friendlyTraceText(row.critique) }
          ]}
        />
      </section>

      <section>
        <h3 className="mb-3 text-lg font-bold text-ink">Linked raw transcripts</h3>
        <DataTable
          rows={detail.incomingCalls}
          columns={[
            { key: "status", label: "Status", render: (row: any) => <Badge value={row.processingStatus} /> },
            { key: "transcript", label: "Transcript", render: (row: any) => row.rawTranscript },
            { key: "duplicate", label: "Duplicate", render: (row: any) => (row.isDuplicate ? "Yes" : "No") }
          ]}
        />
      </section>

      <section>
        <h3 className="mb-3 text-lg font-bold text-ink">Dispatch decisions</h3>
        <DataTable
          rows={detail.dispatches}
          columns={[
            { key: "code", label: "Code", render: (row: any) => row.dispatchCode },
            { key: "type", label: "Type", render: (row: any) => <Badge value={row.resourceType} /> },
            { key: "eta", label: "Live ETA", render: (row: any) => liveEtaText(row.dispatchedAt, row.estimatedArrivalMinutes) },
            { key: "reason", label: "Decision Reason", render: (row: any) => row.decisionReason }
          ]}
        />
      </section>

      <section>
        <h3 className="mb-3 text-lg font-bold text-ink">Alerts generated</h3>
        <DataTable
          rows={detail.alerts}
          columns={[
            { key: "code", label: "Code", render: (row: any) => row.alertCode },
            { key: "type", label: "Type", render: (row: any) => <Badge value={row.alertType} /> },
            { key: "target", label: "Target", render: (row: any) => row.targetOrganization },
            { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> }
          ]}
        />
      </section>
    </div>
  );
}
