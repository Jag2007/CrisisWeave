"use client";

import { Badge, Code } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate, shortId } from "../../lib/format";

export default function SystemLogsPage() {
  return (
    <ListPage
      title="System logs"
      description="A plain event log of everything the backend did, step by step. Useful for debugging a failed call."
      endpoint="/system-logs"
      empty="Log is empty"
      columns={[
        { key: "created", label: "Time", render: (row: any) => <span className="whitespace-nowrap font-mono text-xs text-muted">{formatDate(row.createdAt)}</span> },
        { key: "event", label: "Event", render: (row: any) => <Badge value={row.eventType} /> },
        { key: "message", label: "Message", render: (row: any) => row.message },
        { key: "incident", label: "Incident", render: (row: any) => <Code>{row.incidentId ? shortId(row.incidentId) : "-"}</Code> },
        { key: "batch", label: "Batch", render: (row: any) => <Code>{row.batchId ? shortId(row.batchId) : "-"}</Code> }
      ]}
    />
  );
}
