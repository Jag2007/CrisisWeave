"use client";

import { Badge, IncidentLink } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";

export default function IncidentsPage() {
  return (
    <ListPage
      title="Incidents"
      description="Deduplicated emergencies created by the pipeline."
      endpoint="/incidents"
      columns={[
        { key: "code", label: "Code", render: (row: any) => <IncidentLink id={row._id} code={row.incidentCode} /> },
        { key: "title", label: "Title", render: (row: any) => row.title },
        { key: "type", label: "Type", render: (row: any) => <Badge value={row.incidentType} /> },
        { key: "severity", label: "Severity", render: (row: any) => <Badge value={row.severity} /> },
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> },
        { key: "priority", label: "Priority", render: (row: any) => row.priorityScore },
        { key: "duplicates", label: "Duplicates", render: (row: any) => row.duplicateCount || 0 },
        { key: "location", label: "Location", render: (row: any) => row.locationText || row.city || "-" }
      ]}
    />
  );
}
