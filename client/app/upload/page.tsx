"use client";

// Upload page starts JSON bundle processing, then polls MongoDB batch metadata
// so progress survives navigation and remains visible across the app.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Button, Progress, message } from "antd";
import { UploadCloud } from "lucide-react";
import { apiGet, apiPost, apiPostJson, type ApiListResponse } from "../../lib/api";

type UploadResult = {
  ok: boolean;
  result: {
    batchId: string;
    totalRecords: number;
    status: string;
  };
};

type UploadBatch = {
  _id: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  status: string;
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [batch, setBatch] = useState<UploadBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const activeBatchId = result?.result.batchId;
  const progressPercent = useMemo(() => {
    if (!batch?.totalRecords) return 0;
    return Math.round(((batch.processedRecords + batch.failedRecords) / batch.totalRecords) * 100);
  }, [batch]);

  useEffect(() => {
    if (!activeBatchId) return undefined;
    let active = true;

    const loadBatch = () => {
      apiGet<ApiListResponse<UploadBatch>>("/upload-batches?limit=25")
        .then((response) => {
          if (!active) return;
          const current = response.items.find((item) => item._id === activeBatchId);
          if (current) {
            setBatch(current);
          }
        })
        .catch(() => undefined);
    };

    loadBatch();
    const timer = window.setInterval(loadBatch, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [activeBatchId]);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let response: UploadResult;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        response = await apiPost<UploadResult>("/uploads/json", formData);
      } else {
        response = await apiPostJson<UploadResult>("/uploads/json", JSON.parse(jsonText));
      }
      setResult(response);
      setBatch({
        _id: response.result.batchId,
        totalRecords: response.result.totalRecords,
        processedRecords: 0,
        failedRecords: 0,
        status: response.result.status
      });
      message.success("Upload accepted. Agent graph is processing in the background.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-ink">Upload JSON Bundle</h2>
        <p className="mt-1 text-sm text-slate-500">Upload the Hyderabad sample bundle or paste JSON records directly.</p>
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <label className="block text-sm font-semibold text-slate-700">JSON file</label>
          <div className="mt-3 flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <UploadCloud className="h-10 w-10 text-signal" />
            <input className="mt-4 w-full text-sm" type="file" accept="application/json,.json" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <p className="mt-3 text-xs text-slate-500">Recommended sample: data/samples/hyderabad-emergency-bundle.json</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <label className="block text-sm font-semibold text-slate-700">Paste JSON</label>
          <textarea
            className="mt-3 h-44 w-full rounded-md border border-slate-300 p-3 font-mono text-xs outline-none focus:border-signal"
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            placeholder='{ "records": [{ "transcript": "Fire near HITEC City...", "latitude": 17.4504, "longitude": 78.3808 }] }'
          />
        </div>
      </section>
      <Button
        type="primary"
        onClick={submit}
        loading={loading}
        disabled={loading || (!file && !jsonText.trim())}
      >
        Upload and Start Agent Graph
      </Button>
      {error ? <Alert type="error" message="Upload failed" description={error} showIcon /> : null}
      {result ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-bold">Agent graph started for batch {result.result.batchId}</p>
          <p className="mt-1 text-xs text-emerald-800">
            Processing continues on the backend. You can open Overview, Incidents, Agent Traces, or Upload Batches and watch records appear live.
          </p>
          <div className="mt-4">
            <Progress percent={progressPercent} status={batch?.status === "FAILED" ? "exception" : batch?.status === "COMPLETED" ? "success" : "active"} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <span>Total: {batch?.totalRecords ?? result.result.totalRecords}</span>
            <span>Processed: {batch?.processedRecords ?? 0}</span>
            <span>Failed: {batch?.failedRecords ?? 0}</span>
            <span>Status: {batch?.status ?? result.result.status}</span>
          </div>
          <Link href="/agent-traces" className="mt-4 inline-block font-semibold text-emerald-950 underline">
            View live agent reasoning
          </Link>
        </div>
      ) : null}
    </div>
  );
}
