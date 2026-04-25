"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { apiPost, apiPostJson } from "../../lib/api";

type UploadResult = {
  ok: boolean;
  result: {
    batchId: string;
    totalRecords: number;
    processedRecords: number;
    failedRecords: number;
    incidentsCreated: number;
    duplicatesFound: number;
  };
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      <button
        onClick={submit}
        disabled={loading || (!file && !jsonText.trim())}
        className="rounded-md bg-signal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? "Processing..." : "Upload and Run Pipeline"}
      </button>
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {result ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <p className="font-bold">Pipeline completed for batch {result.result.batchId}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            <span>Total: {result.result.totalRecords}</span>
            <span>Processed: {result.result.processedRecords}</span>
            <span>Failed: {result.result.failedRecords}</span>
            <span>Created: {result.result.incidentsCreated}</span>
            <span>Duplicates: {result.result.duplicatesFound}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
