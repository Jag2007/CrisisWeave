import { humanize } from "../lib/format";

// Severity gets a coloured square + text. Everything else is a quiet outlined tag,
// with a coloured dot only for states worth noticing.
const severityColor: Record<string, string> = {
  CRITICAL: "bg-critical",
  HIGH: "bg-high",
  MEDIUM: "bg-medium",
  LOW: "bg-low"
};

const stateDot: Record<string, string> = {
  AVAILABLE: "bg-low",
  BUSY: "bg-high",
  OFFLINE: "bg-muted",
  DISPATCHED: "bg-teal",
  ASSIGNED: "bg-teal",
  DISPATCH_PENDING: "bg-high",
  PROCESSING: "bg-teal animate-pulse",
  COMPLETED: "bg-low",
  INCIDENT_CREATED: "bg-low",
  SENT: "bg-low",
  FAILED: "bg-critical",
  PIPELINE_FAILED: "bg-critical",
  DUPLICATE: "bg-medium",
  DUPLICATE_FOUND: "bg-medium"
};

export function Badge({ value }: { value?: string }) {
  if (!value) return <span className="text-muted">-</span>;

  if (severityColor[value]) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-ink">
        <span className={`h-2.5 w-2.5 rounded-[2px] ${severityColor[value]}`} />
        {value.toLowerCase()}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-rule bg-paper px-1.5 py-0.5 text-xs text-slate">
      {stateDot[value] ? <span className={`h-1.5 w-1.5 rounded-full ${stateDot[value]}`} /> : null}
      {humanize(value)}
    </span>
  );
}
