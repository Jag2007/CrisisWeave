"use client";

import { Badge, IncidentLink } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate } from "../../lib/format";

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
        { key: "eta", label: "ETA", render: (row: any) => `${row.estimatedArrivalMinutes} min` },
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> },
        { key: "time", label: "Dispatched", render: (row: any) => formatDate(row.dispatchedAt) }
      ]}
    />
  );
}
