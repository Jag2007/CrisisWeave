"use client";

import { Badge } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate } from "../../lib/format";

export default function UploadBatchesPage() {
  return (
    <ListPage
      title="Upload Batches"
      description="JSON bundle metadata and processing counts."
      endpoint="/upload-batches"
      columns={[
        { key: "file", label: "File", render: (row: any) => row.originalFileName },
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> },
        { key: "total", label: "Total", render: (row: any) => row.totalRecords },
        { key: "processed", label: "Processed", render: (row: any) => row.processedRecords },
        { key: "failed", label: "Failed", render: (row: any) => row.failedRecords },
        { key: "source", label: "Source", render: (row: any) => row.uploadSource || "-" },
        { key: "created", label: "Created", render: (row: any) => formatDate(row.createdAt) }
      ]}
    />
  );
}
