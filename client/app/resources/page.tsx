"use client";

import { Badge } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate } from "../../lib/format";

export default function ResourcesPage() {
  return (
    <ListPage
      title="Resources"
      description="Hyderabad response units available for dispatch matching."
      endpoint="/resources"
      columns={[
        { key: "code", label: "Code", render: (row: any) => row.resourceCode },
        { key: "name", label: "Name", render: (row: any) => row.name },
        { key: "type", label: "Type", render: (row: any) => <Badge value={row.resourceType} /> },
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> },
        { key: "base", label: "Base", render: (row: any) => row.baseLocationText || "-" },
        { key: "capabilities", label: "Capabilities", render: (row: any) => (row.capabilities || []).join(", ") },
        { key: "updated", label: "Updated", render: (row: any) => formatDate(row.lastStatusUpdatedAt) }
      ]}
    />
  );
}
