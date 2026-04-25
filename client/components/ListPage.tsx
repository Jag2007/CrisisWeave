"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    apiGet<ApiListResponse<T>>(`${endpoint}?limit=50`)
      .then((data) => setRows(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load records"))
      .finally(() => setLoading(false));
  }, [endpoint]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {loading ? <div className="rounded-lg bg-white p-6 text-sm text-slate-500 shadow-soft">Loading...</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
      {!loading && !error ? <DataTable columns={columns} rows={rows} /> : null}
    </div>
  );
}
