"use client";

import { Badge, IncidentLink } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate } from "../../lib/format";

export default function IncomingCallsPage() {
  return (
    <ListPage
      title="Incoming calls"
      description="Every raw transcript exactly as it was uploaded, including the ones the Dedup agent merged into an existing incident."
      endpoint="/incoming-calls"
      empty="No calls received yet"
      columns={[
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.processingStatus} /> },
        { key: "transcript", label: "Transcript", render: (row: any) => <span className="line-clamp-3 leading-relaxed">{row.rawTranscript}</span> },
        { key: "caller", label: "Caller", render: (row: any) => row.callerName || <span className="text-muted">Anonymous</span> },
        { key: "location", label: "Location", render: (row: any) => row.locationText || row.city || "-" },
        { key: "incident", label: "Incident", render: (row: any) => <IncidentLink id={row.linkedIncidentId} /> },
        { key: "duplicate", label: "Duplicate", render: (row: any) => (row.isDuplicate ? "Yes" : "No") },
        { key: "created", label: "Received", render: (row: any) => <span className="whitespace-nowrap text-xs text-muted">{formatDate(row.createdAt)}</span> }
      ]}
    />
  );
}
