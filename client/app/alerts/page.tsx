"use client";

import { Badge, Code, IncidentLink } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate, humanize } from "../../lib/format";

export default function AlertsPage() {
  return (
    <ListPage
      title="Alerts"
      description="Notifications raised for hospitals, fire, police and other agencies. These are simulated records, so nothing is actually sent."
      endpoint="/alerts"
      filter={{ param: "severity", options: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] }}
      empty="No alerts raised yet"
      columns={[
        { key: "code", label: "Alert", render: (row: any) => <Code>{row.alertCode}</Code> },
        { key: "incident", label: "Incident", render: (row: any) => <IncidentLink id={row.incidentId} /> },
        { key: "target", label: "Sent to", render: (row: any) => <span className="font-medium">{row.targetOrganization}</span> },
        { key: "type", label: "Type", render: (row: any) => humanize(row.alertType) },
        { key: "severity", label: "Severity", render: (row: any) => <Badge value={row.severity} /> },
        { key: "message", label: "Message", render: (row: any) => <span className="line-clamp-2 text-xs text-slate">{row.message}</span> },
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> },
        { key: "generated", label: "Raised", render: (row: any) => <span className="whitespace-nowrap text-xs text-muted">{formatDate(row.generatedAt)}</span> }
      ]}
    />
  );
}
