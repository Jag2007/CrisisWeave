// The seven agents every call passes through, in order. Shown on the overview and
// used to label trace steps so the pipeline reads the same everywhere.
export const AGENTS: Array<{ name: string; label: string; job: string }> = [
  { name: "TRIAGE_AGENT", label: "Triage", job: "Reads the transcript, picks type and severity" },
  { name: "DEDUP_AGENT", label: "Dedup", job: "Checks if this is an incident we already have" },
  { name: "PRIORITY_AGENT", label: "Priority", job: "Scores urgency from 10 to 100" },
  { name: "RESOURCE_AGENT", label: "Resource", job: "Ranks free units by type, skills and distance" },
  { name: "ROUTING_AGENT", label: "Routing", job: "Estimates distance and arrival time" },
  { name: "DISPATCH_AGENT", label: "Dispatch", job: "Assigns units and records why" },
  { name: "CRITIC_AGENT", label: "Critic", job: "Reviews the plan, asks for one retry if weak" }
];

export function agentLabel(name?: string): string {
  return AGENTS.find((agent) => agent.name === name)?.label || name || "-";
}

export function AgentChain() {
  return (
    <div className="panel overflow-x-auto">
      <ol className="flex min-w-[860px]">
        {AGENTS.map((agent, index) => (
          <li key={agent.name} className="relative flex-1 border-r border-rule px-3.5 py-3 last:border-r-0">
            <p className="font-mono text-[11px] text-muted">{String(index + 1).padStart(2, "0")}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{agent.label}</p>
            <p className="mt-0.5 text-xs leading-snug text-muted">{agent.job}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
