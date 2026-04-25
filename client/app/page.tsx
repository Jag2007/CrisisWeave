"use client";

// Dashboard overview shows live MongoDB/agent graph status and gives admins
// reliable seed/reset controls for the Hyderabad demo.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Button, Skeleton, message } from "antd";
import { Database, FileJson, RefreshCcw, ShieldCheck } from "lucide-react";
import { apiGet, apiPostJson } from "../lib/api";
import { formatDate } from "../lib/format";
import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";

type Summary = {
  totalUploadedBatches: number;
  totalIncomingCalls: number;
  totalActiveIncidents: number;
  duplicateCallsCount: number;
  incidentsBySeverity: Array<{ _id: string; count: number }>;
  incidentsByType: Array<{ _id: string; count: number }>;
  availableResources: number;
  busyResources: number;
  totalDispatches: number;
  totalAlerts: number;
  totalAgentTraces: number;
  recentSystemLogs: Array<{ _id: string; eventType: string; message: string; createdAt: string }>;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lastSummarySnapshot = useRef("");

  const load = (initial = false) => {
    apiGet<{ ok: boolean; data: Summary }>("/dashboard/summary")
      .then((response) => {
        const nextSnapshot = JSON.stringify(response.data);
        if (nextSnapshot !== lastSummarySnapshot.current) {
          lastSummarySnapshot.current = nextSnapshot;
          setSummary(response.data);
        }
        setError(null);
      })
      .catch((err) => {
        if (initial || !lastSummarySnapshot.current) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard");
        }
      });
  };

  useEffect(() => {
    load(true);
    const timer = window.setInterval(() => load(false), 3000);
    return () => window.clearInterval(timer);
  }, []);

  const runSeed = async () => {
    setBusy(true);
    try {
      await apiPostJson("/admin/seed", {});
      message.success("Hyderabad demo users and resources seeded.");
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Seed failed. Check that the backend and MongoDB are running.");
    } finally {
      setBusy(false);
    }
  };

  const resetDemo = async () => {
    setBusy(true);
    try {
      await apiPostJson("/admin/reset-demo-data", {});
      message.success("Demo data reset and seed data recreated.");
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Reset failed. Check that the backend and MongoDB are running.");
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return <Alert type="error" message="Dashboard failed to load" description={error} showIcon />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-signal">Hyderabad Demo Grid</p>
            <h2 className="mt-1 text-3xl font-bold text-ink">Emergency transcript intelligence dashboard</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Upload bundled JSON transcripts and watch CrisisWeave store calls, triage incidents, deduplicate reports, assign resources, generate simulated alerts, and log every step.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="primary" loading={busy} onClick={runSeed} icon={<Database className="h-4 w-4" />}>Seed</Button>
            <Button loading={busy} onClick={resetDemo} icon={<RefreshCcw className="h-4 w-4" />}>Reset Demo</Button>
            <Link href="/upload" className="inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
              <FileJson className="h-4 w-4" /> Upload JSON
            </Link>
          </div>
        </div>
      </section>

      {!summary ? <DashboardSkeleton /> : null}

      {summary ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Uploaded Batches" value={summary?.totalUploadedBatches ?? "-"} />
        <MetricCard label="Incoming Calls" value={summary?.totalIncomingCalls ?? "-"} />
        <MetricCard label="Active Incidents" value={summary?.totalActiveIncidents ?? "-"} />
        <MetricCard label="Duplicate Calls" value={summary?.duplicateCallsCount ?? "-"} />
        <MetricCard label="Available Resources" value={summary?.availableResources ?? "-"} />
        <MetricCard label="Busy Resources" value={summary?.busyResources ?? "-"} />
        <MetricCard label="Dispatches" value={summary?.totalDispatches ?? "-"} />
        <MetricCard label="Alerts" value={summary?.totalAlerts ?? "-"} />
        <MetricCard label="Agent Decisions" value={summary?.totalAgentTraces ?? "-"} detail="Reasoning steps stored" />
      </div> : null}

      {summary ? <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="flex items-center gap-2 text-lg font-bold text-ink"><ShieldCheck className="h-5 w-5 text-signal" /> Incidents by severity</h3>
          <div className="mt-4 space-y-2">
            {(summary?.incidentsBySeverity || []).map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <Badge value={item._id} />
                <span className="font-bold text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="text-lg font-bold text-ink">Incidents by type</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(summary?.incidentsByType || []).map((item) => (
              <div key={item._id} className="rounded-md bg-slate-50 px-3 py-2">
                <p className="text-xs font-semibold text-slate-500">{item._id?.replaceAll("_", " ")}</p>
                <p className="text-xl font-bold text-ink">{item.count}</p>
              </div>
            ))}
          </div>
        </section>
      </div> : null}

      {summary ? <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h3 className="text-lg font-bold text-ink">Recent system logs</h3>
        <div className="mt-4 space-y-3">
          {(summary?.recentSystemLogs || []).map((log) => (
            <div key={log._id} className="flex flex-col gap-1 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge value={log.eventType} />
                <p className="mt-1 text-sm text-slate-700">{log.message}</p>
              </div>
              <p className="text-xs text-slate-500">{formatDate(log.createdAt)}</p>
            </div>
          ))}
        </div>
      </section> : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <Skeleton active paragraph={{ rows: 1, width: "45%" }} title={{ width: "70%" }} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <Skeleton active paragraph={{ rows: 5 }} title={{ width: "35%" }} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <Skeleton active paragraph={{ rows: 5 }} title={{ width: "35%" }} />
        </div>
      </div>
    </div>
  );
}
