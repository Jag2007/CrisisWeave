"use client";

// Agent trace page exposes the reasoning memory of every graph step in plain language.
import { Badge } from "../../components/DataTable";
import { ListPage } from "../../components/ListPage";
import { formatDate } from "../../lib/format";
import { friendlyTraceText } from "../../lib/traceText";

export default function AgentTracesPage() {
  return (
    <ListPage
      title="Agent Traces"
      description="Step-by-step memory of every agent decision in the execution graph."
      endpoint="/agent-traces"
      columns={[
        { key: "step", label: "Step", render: (row: any) => `${row.stepIndex}${row.retryAttempt ? ` / retry ${row.retryAttempt}` : ""}` },
        { key: "agent", label: "Agent", render: (row: any) => <Badge value={row.agentName} /> },
        { key: "goal", label: "Goal", render: (row: any) => row.goal },
        { key: "decision", label: "Decision", render: (row: any) => friendlyTraceText(row.decision) },
        { key: "reasoning", label: "Reasoning", render: (row: any) => <span className="line-clamp-4">{friendlyTraceText(row.reasoning)}</span> },
        { key: "critique", label: "Critique", render: (row: any) => friendlyTraceText(row.critique) },
        { key: "time", label: "Created", render: (row: any) => formatDate(row.createdAt) }
      ]}
    />
  );
}
