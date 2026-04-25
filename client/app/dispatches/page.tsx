"use client";

// Dispatch list shows assignment decisions and a live ETA derived from dispatch time.
import { Badge, IncidentLink } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate } from "../../lib/format";
import { liveEtaText } from "../../lib/liveEta";

export default function DispatchesPage() {
  return (
    <ListPage
      title="Dispatches"
      description="Resource assignment decisions with distance, ETA, and rationale."
      endpoint="/dispatches"
      columns={[
        { key: "code", label: "Code", render: (row: any) => row.dispatchCode },
        { key: "incident", label: "Incident", render: (row: any) => <IncidentLink id={row.incidentId} /> },
        { key: "type", label: "Resource Type", render: (row: any) => <Badge value={row.resourceType} /> },
        { key: "severity", label: "Severity", render: (row: any) => <Badge value={row.incidentSeverity} /> },
        { key: "distance", label: "Distance", render: (row: any) => `${row.distanceKm} km` },
        { key: "eta", label: "Live ETA", render: (row: any) => liveEtaText(row.dispatchedAt, row.estimatedArrivalMinutes) },
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> },
        { key: "time", label: "Dispatched", render: (row: any) => formatDate(row.dispatchedAt) }
      ]}
    />
  );
}
