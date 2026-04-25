"use client";

import { Badge, IncidentLink } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate } from "../../lib/format";

export default function AlertsPage() {
  return (
    <ListPage
      title="Alerts"
      description="Simulated organization alerts generated for dashboard visibility."
      endpoint="/alerts"
      columns={[
        { key: "code", label: "Code", render: (row: any) => row.alertCode },
        { key: "incident", label: "Incident", render: (row: any) => <IncidentLink id={row.incidentId} /> },
        { key: "type", label: "Type", render: (row: any) => <Badge value={row.alertType} /> },
        { key: "target", label: "Target", render: (row: any) => row.targetOrganization },
        { key: "severity", label: "Severity", render: (row: any) => <Badge value={row.severity} /> },
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> },
        { key: "generated", label: "Generated", render: (row: any) => formatDate(row.generatedAt) }
      ]}
    />
  );
}
