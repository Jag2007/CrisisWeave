"use client";

// Dispatch list shows assignment decisions and a live ETA derived from dispatch time.
import { Badge, Code, IncidentLink } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate, humanize } from "../../lib/format";
import { liveEtaText } from "../../lib/liveEta";

export default function DispatchesPage() {
  return (
    <ListPage
      title="Dispatches"
      description="Units the Dispatch agent sent out, with distance, a live ETA countdown and the reason it chose that unit."
      endpoint="/dispatches"
      empty="Nothing dispatched yet"
      columns={[
        { key: "code", label: "Dispatch", render: (row: any) => <Code>{row.dispatchCode}</Code> },
        { key: "incident", label: "Incident", render: (row: any) => <IncidentLink id={row.incidentId} /> },
        { key: "type", label: "Unit type", render: (row: any) => humanize(row.resourceType) },
        { key: "severity", label: "Severity", render: (row: any) => <Badge value={row.incidentSeverity} /> },
        { key: "distance", label: "Distance", render: (row: any) => <Code>{row.distanceKm} km</Code> },
        { key: "eta", label: "ETA", render: (row: any) => <span className="whitespace-nowrap font-mono text-xs text-teal-dark">{liveEtaText(row.dispatchedAt, row.estimatedArrivalMinutes)}</span> },
        { key: "reason", label: "Why this unit", render: (row: any) => <span className="line-clamp-2 text-xs text-slate">{row.decisionReason}</span> },
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> },
        { key: "time", label: "Sent", render: (row: any) => <span className="whitespace-nowrap text-xs text-muted">{formatDate(row.dispatchedAt)}</span> }
      ]}
    />
  );
}
