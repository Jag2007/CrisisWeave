"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "../../../lib/api";
import { Badge } from "../../../components/Badge";
import { DataTable } from "../../../components/DataTable";

type Detail = {
  incident: any;
  incomingCalls: any[];
  assignedResources: any[];
  dispatches: any[];
  alerts: any[];
};

export default function IncidentDetailPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ ok: boolean; data: Detail }>(`/incidents/${params.id}`)
      .then((response) => setDetail(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load incident"));
  }, [params.id]);

  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>;
  if (!detail) return <div className="rounded-lg bg-white p-6 shadow-soft">Loading...</div>;

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
            { key: "eta", label: "ETA", render: (row: any) => `${row.estimatedArrivalMinutes} min` },
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
