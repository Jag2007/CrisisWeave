"use client";

import { Badge, Code } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate, humanize } from "../../lib/format";

export default function UploadBatchesPage() {
  return (
    <ListPage
      title="Upload batches"
      description="Each JSON upload and how far the pipeline has got through it."
      endpoint="/upload-batches"
      empty="No uploads yet"
      columns={[
        { key: "file", label: "File", render: (row: any) => <span className="font-medium">{row.originalFileName}</span> },
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> },
        {
          key: "progress",
          label: "Progress",
          render: (row: any) => {
            const done = row.processedRecords + row.failedRecords;
            return (
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-20 rounded-sm bg-paper">
                  <span className="block h-1.5 rounded-sm bg-teal" style={{ width: `${row.totalRecords ? (done / row.totalRecords) * 100 : 0}%` }} />
                </span>
                <Code>
                  {done}/{row.totalRecords}
                </Code>
              </div>
            );
          }
        },
        { key: "processed", label: "Processed", render: (row: any) => <Code>{row.processedRecords}</Code> },
        { key: "failed", label: "Failed", render: (row: any) => <Code>{row.failedRecords}</Code> },
        { key: "source", label: "Source", render: (row: any) => humanize(row.uploadSource) },
        { key: "created", label: "Uploaded", render: (row: any) => <span className="whitespace-nowrap text-xs text-muted">{formatDate(row.createdAt)}</span> }
      ]}
    />
  );
}
