"use client";

// Reusable live list view for database collections. It polls so long-running
// upload batches remain visible even when the user navigates between pages.
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "antd";
import { apiGet, type ApiListResponse } from "../lib/api";
import { DataTable, type Column } from "./DataTable";

export function ListPage<T extends { _id?: string }>({
  title,
  description,
  endpoint,
  columns
}: {
  title: string;
  description: string;
  endpoint: string;
  columns: Column<T>[];
}) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastRowsSnapshot = useRef("");

  useEffect(() => {
    let active = true;

    const load = (initial = false) => {
      apiGet<ApiListResponse<T>>(`${endpoint}?limit=50`)
        .then((data) => {
          if (!active) return;
          const nextSnapshot = JSON.stringify(data.items);
          if (nextSnapshot !== lastRowsSnapshot.current) {
            lastRowsSnapshot.current = nextSnapshot;
            setRows(data.items);
          }
          setError(null);
        })
        .catch((err) => {
          if (!active) return;
          if (initial || !lastRowsSnapshot.current) {
            setError(err instanceof Error ? err.message : "Failed to load records");
          }
        })
        .finally(() => {
          if (!active) return;
          setLoading(false);
        });
    };

    load(true);
    const timer = window.setInterval(() => load(false), 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [endpoint]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <Skeleton active paragraph={{ rows: 7 }} title={{ width: "30%" }} />
        </div>
      ) : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {!loading && !error ? <DataTable columns={columns} rows={rows} /> : null}
    </div>
  );
}
