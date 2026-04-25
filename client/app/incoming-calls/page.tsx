"use client";

import { Badge, IncidentLink } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate } from "../../lib/format";

export default function IncomingCallsPage() {
  return (
    <ListPage
      title="Incoming Calls"
      description="Every raw transcript stored from uploaded JSON bundles, including duplicates."
      endpoint="/incoming-calls"
      columns={[
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.processingStatus} /> },
        { key: "transcript", label: "Transcript", render: (row: any) => <span className="line-clamp-3">{row.rawTranscript}</span> },
        { key: "location", label: "Location", render: (row: any) => row.locationText || row.city || "-" },
        { key: "incident", label: "Incident", render: (row: any) => <IncidentLink id={row.linkedIncidentId} /> },
        { key: "duplicate", label: "Duplicate", render: (row: any) => (row.isDuplicate ? "Yes" : "No") },
        { key: "created", label: "Created", render: (row: any) => formatDate(row.createdAt) }
      ]}
    />
  );
}
