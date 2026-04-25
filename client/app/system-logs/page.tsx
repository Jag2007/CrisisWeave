"use client";

import { Badge } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate } from "../../lib/format";

export default function SystemLogsPage() {
  return (
    <ListPage
      title="System Logs"
      description="Pipeline events that explain every automated backend step."
      endpoint="/system-logs"
      columns={[
        { key: "event", label: "Event", render: (row: any) => <Badge value={row.eventType} /> },
        { key: "message", label: "Message", render: (row: any) => row.message },
        { key: "incident", label: "Incident ID", render: (row: any) => row.incidentId?.slice(-6).toUpperCase() || "-" },
        { key: "batch", label: "Batch ID", render: (row: any) => row.batchId?.slice(-6).toUpperCase() || "-" },
        { key: "created", label: "Created", render: (row: any) => formatDate(row.createdAt) }
      ]}
    />
  );
}
