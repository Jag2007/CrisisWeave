"use client";

import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

const collections = [
  { label: "Upload Batches", endpoint: "/upload-batches" },
  { label: "Incoming Calls", endpoint: "/incoming-calls" },
  { label: "Incidents", endpoint: "/incidents" },
  { label: "Resources", endpoint: "/resources" },
  { label: "Dispatches", endpoint: "/dispatches" },
  { label: "Alerts", endpoint: "/alerts" },
  { label: "Agent Traces", endpoint: "/agent-traces" },
  { label: "System Logs", endpoint: "/system-logs" }
];

export default function DataViewerPage() {
  const [endpoint, setEndpoint] = useState(collections[0].endpoint);
  const [payload, setPayload] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    apiGet(`${endpoint}?limit=10`)
      .then(setPayload)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load collection"));
  }, [endpoint]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-ink">Data Viewer</h2>
        <p className="mt-1 text-sm text-slate-500">Inspect raw API payloads for judging and debugging.</p>
      </div>
      <select value={endpoint} onChange={(event) => setEndpoint(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
        {collections.map((collection) => (
          <option key={collection.endpoint} value={collection.endpoint}>
            {collection.label}
          </option>
        ))}
      </select>
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      <pre className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100 shadow-soft">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}
