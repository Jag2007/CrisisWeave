"use client";

import { Badge, Code, IncidentLink } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { humanize, timeAgo } from "../../lib/format";

export default function IncidentsPage() {
  return (
    <ListPage
      title="Incidents"
      description="One row per real-world emergency. Duplicate calls about the same event are merged into a single incident."
      endpoint="/incidents"
      filter={{ param: "severity", options: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] }}
      empty="No incidents yet"
      emptyHint="They appear here as soon as the Triage and Dedup agents finish a call."
      columns={[
        { key: "code", label: "Incident", render: (row: any) => <IncidentLink id={row._id} code={row.incidentCode} /> },
        {
          key: "title",
          label: "What",
          render: (row: any) => (
            <div>
              <p className="font-medium">{row.title}</p>
              <p className="text-xs text-muted">{humanize(row.incidentType)}</p>
            </div>
          )
        },
        { key: "severity", label: "Severity", render: (row: any) => <Badge value={row.severity} /> },
        { key: "priority", label: "Priority", render: (row: any) => <PriorityBar score={row.priorityScore} /> },
        { key: "status", label: "Status", render: (row: any) => <Badge value={row.status} /> },
        { key: "duplicates", label: "Dup. calls", render: (row: any) => <Code>{row.duplicateCount || 0}</Code> },
        { key: "location", label: "Location", render: (row: any) => row.locationText || row.city || "-" },
        { key: "reported", label: "Reported", render: (row: any) => <span className="whitespace-nowrap text-xs text-muted">{timeAgo(row.createdAt)}</span> }
      ]}
    />
  );
}

function PriorityBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 font-mono text-xs tabular-nums">{score}</span>
      <span className="h-1.5 w-16 rounded-sm bg-paper">
        <span className="block h-1.5 rounded-sm bg-slate/70" style={{ width: `${Math.min(100, score)}%` }} />
      </span>
    </div>
  );
}
