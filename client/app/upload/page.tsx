"use client";

// Upload page: pick a JSON bundle (file, paste, or the bundled Hyderabad sample),
// start the agent pipeline, then watch progress and agent decisions arrive live.
import Link from "next/link";
import { useMemo, useState } from "react";
import { apiPost, apiPostJson, type ApiListResponse } from "../../lib/api";
import { formatTime } from "../../lib/format";
import { usePolling } from "../../lib/usePolling";
import { friendlyTraceText } from "../../lib/traceText";
import { agentLabel } from "../../components/AgentChain";
import { Badge } from "../../components/Badge";
import { Button, PageHeader, Panel } from "../../components/ui";

type UploadResult = { ok: boolean; result: { batchId: string; totalRecords: number; status: string } };
type UploadBatch = { _id: string; totalRecords: number; processedRecords: number; failedRecords: number; status: string };
type Trace = { _id: string; agentName: string; decision: string; createdAt: string };

const SAMPLE_PATH = "/samples/hyderabad-emergency-bundle.json";

// Accepts the same shapes the backend does: an array, { records: [] } or { transcripts: [] }.
function countRecords(payload: unknown): number {
  if (Array.isArray(payload)) return payload.length;
  const object = payload as { records?: unknown[]; transcripts?: unknown[] };
  return object?.records?.length || object?.transcripts?.length || 0;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Live progress for the batch we just started.
  const batches = usePolling<ApiListResponse<UploadBatch>>(batchId ? "/upload-batches?limit=10" : null, 2000);
  const traces = usePolling<ApiListResponse<Trace>>(batchId ? `/agent-traces?limit=12&batchId=${batchId}` : null, 2000);
  const batch = batches.data?.items.find((item) => item._id === batchId);
  const done = batch ? batch.processedRecords + batch.failedRecords : 0;
  const percent = batch?.totalRecords ? Math.round((done / batch.totalRecords) * 100) : 0;

  const pastedCount = useMemo(() => {
    if (!jsonText.trim()) return null;
    try {
      return countRecords(JSON.parse(jsonText));
    } catch {
      return -1;
    }
  }, [jsonText]);

  const loadSample = async () => {
    const response = await fetch(SAMPLE_PATH);
    setFile(null);
    setJsonText(JSON.stringify(await response.json(), null, 2));
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let response: UploadResult;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        response = await apiPost<UploadResult>("/uploads/json", formData);
      } else {
        response = await apiPostJson<UploadResult>("/uploads/json", JSON.parse(jsonText));
      }
      setBatchId(response.result.batchId);
    } catch (err) {
      setError(err instanceof SyntaxError ? "That isn't valid JSON." : err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const ready = Boolean(file) || (pastedCount !== null && pastedCount > 0);

  return (
    <div>
      <PageHeader
        title="Upload calls"
        description="Each record is one emergency call transcript. The backend stores the calls first, then runs every call through the seven agents in the background."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="1 · Choose calls">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const dropped = event.dataTransfer.files?.[0];
              if (dropped) {
                setFile(dropped);
                setJsonText("");
              }
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded border border-dashed px-4 py-8 text-center transition-colors ${
              dragging ? "border-teal bg-teal-soft" : "border-rule bg-paper/50 hover:border-slate/40"
            }`}
          >
            <span className="text-sm font-medium text-ink">{file ? file.name : "Drop a .json file or click to browse"}</span>
            <span className="mt-1 text-xs text-muted">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Array of records, or { \"records\": [...] }"}
            </span>
            <input
              className="hidden"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setJsonText("");
              }}
            />
          </label>

          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-rule" /> or paste <span className="h-px flex-1 bg-rule" />
          </div>

          <textarea
            className="h-48 w-full resize-y rounded border border-rule bg-surface p-3 font-mono text-xs leading-relaxed outline-none focus:border-teal"
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value);
              setFile(null);
            }}
            placeholder={'{\n  "records": [\n    { "transcript": "Smoke on the 2nd floor near Cyber Towers", "latitude": 17.4504, "longitude": 78.3808 }\n  ]\n}'}
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => void loadSample()} className="text-sm text-teal hover:underline">
              Load the Hyderabad sample (10 calls)
            </button>
            <span className="font-mono text-xs text-muted">
              {pastedCount === -1 ? "invalid JSON" : pastedCount !== null ? `${pastedCount} records` : ""}
            </span>
          </div>
        </Panel>

        <Panel title="2 · Run the agents">
          {!batchId ? (
            <div>
              <p className="text-sm text-muted">
                Calls are handled one at a time: triage → dedup → priority → resource → routing → dispatch → critic.
                With the free Groq tier, expect roughly 15–20 seconds per call.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Button variant="primary" onClick={() => void submit()} disabled={!ready || submitting}>
                  {submitting ? "Uploading…" : "Start processing"}
                </Button>
                {error ? <span className="text-sm text-critical">{error}</span> : null}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl tabular-nums">
                  {done}
                  <span className="text-muted"> / {batch?.totalRecords ?? "…"}</span>
                </span>
                <Badge value={batch?.status || "PROCESSING"} />
              </div>
              <div className="mt-2 h-1.5 rounded-sm bg-paper">
                <div className="h-1.5 rounded-sm bg-teal transition-all duration-500" style={{ width: `${percent}%` }} />
              </div>
              {batch?.failedRecords ? (
                <p className="mt-2 text-xs text-critical">{batch.failedRecords} call(s) failed. See System logs.</p>
              ) : null}

              <p className="eyebrow mb-2 mt-5">Latest agent decisions</p>
              <ul className="max-h-[300px] space-y-0 overflow-y-auto">
                {(traces.data?.items || []).map((trace) => (
                  <li key={trace._id} className="flex gap-3 border-b border-rule/70 py-2 last:border-0">
                    <span className="w-16 shrink-0 text-xs font-semibold text-teal-dark">{agentLabel(trace.agentName)}</span>
                    <span className="flex-1 text-[13px] leading-snug text-ink">{friendlyTraceText(trace.decision)}</span>
                    <span className="shrink-0 font-mono text-[11px] text-muted">{formatTime(trace.createdAt)}</span>
                  </li>
                ))}
                {!traces.data?.items.length ? <li className="py-2 text-sm text-muted">Waiting for the first agent…</li> : null}
              </ul>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/" className="inline-flex h-9 items-center rounded border border-rule px-3.5 text-sm hover:bg-paper">
                  Watch the map
                </Link>
                <Link href="/agent-traces" className="inline-flex h-9 items-center rounded border border-rule px-3.5 text-sm hover:bg-paper">
                  Full agent traces
                </Link>
                <Button
                  onClick={() => {
                    setBatchId(null);
                    setFile(null);
                    setJsonText("");
                  }}
                >
                  Upload another
                </Button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
