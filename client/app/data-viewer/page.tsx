"use client";

// Raw JSON straight from the API, one collection at a time. Handy for debugging and for
// showing exactly what is stored in MongoDB.
import { useState } from "react";
import { usePolling } from "../../lib/usePolling";
import { ErrorState, PageHeader } from "../../components/ui";

const collections = [
  { label: "Upload batches", endpoint: "/upload-batches" },
  { label: "Incoming calls", endpoint: "/incoming-calls" },
  { label: "Incidents", endpoint: "/incidents" },
  { label: "Resources", endpoint: "/resources" },
  { label: "Dispatches", endpoint: "/dispatches" },
  { label: "Alerts", endpoint: "/alerts" },
  { label: "Agent traces", endpoint: "/agent-traces" },
  { label: "System logs", endpoint: "/system-logs" }
];

export default function DataViewerPage() {
  const [endpoint, setEndpoint] = useState(collections[0].endpoint);
  const { data, error, reload } = usePolling<unknown>(`${endpoint}?limit=10`, 10000);

  return (
    <div>
      <PageHeader title="Data viewer" description="The latest 10 documents from each MongoDB collection, exactly as the API returns them." />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {collections.map((collection) => (
          <button
            key={collection.endpoint}
            onClick={() => setEndpoint(collection.endpoint)}
            className={`h-7 rounded border px-2.5 text-xs transition-colors ${
              endpoint === collection.endpoint ? "border-slate bg-slate text-white" : "border-rule bg-surface text-slate hover:border-slate/40"
            }`}
          >
            {collection.label}
          </button>
        ))}
      </div>
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      <pre className="max-h-[72vh] overflow-auto rounded border border-ink bg-ink p-4 font-mono text-xs leading-relaxed text-[#d7dde4]">
        <span className="text-[#8b95a1]">GET /api{endpoint}?limit=10{"\n\n"}</span>
        {data ? JSON.stringify(data, null, 2) : "Loading…"}
      </pre>
    </div>
  );
}
