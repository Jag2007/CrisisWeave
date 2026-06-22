"use client";

// Generic "list a collection" page: header, optional filter chips, live table.
import { useState } from "react";
import type React from "react";
import type { ApiListResponse } from "../lib/api";
import { usePolling } from "../lib/usePolling";
import { humanize } from "../lib/format";
import { DataTable, type Column } from "./DataTable";
import { ErrorState, LoadingBlock, PageHeader } from "./ui";

type Filter = { param: string; options: string[] };

export function ListPage<T extends { _id?: string }>({
  title,
  description,
  endpoint,
  columns,
  filter,
  empty,
  emptyHint
}: {
  title: string;
  description: string;
  endpoint: string;
  columns: Column<T>[];
  filter?: Filter;
  empty?: string;
  emptyHint?: React.ReactNode;
}) {
  const [selected, setSelected] = useState<string>("");
  const query = selected && filter ? `&${filter.param}=${selected}` : "";
  const { data, error, loading, reload } = usePolling<ApiListResponse<T>>(`${endpoint}?limit=50${query}`);

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          data ? (
            <span className="eyebrow self-end">
              {data.pagination.total} record{data.pagination.total === 1 ? "" : "s"}
            </span>
          ) : null
        }
      />

      {filter ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {["", ...filter.options].map((option) => (
            <button
              key={option || "all"}
              onClick={() => setSelected(option)}
              className={`h-7 rounded border px-2.5 text-xs transition-colors ${
                selected === option
                  ? "border-slate bg-slate text-white"
                  : "border-rule bg-surface text-slate hover:border-slate/40"
              }`}
            >
              {option ? humanize(option) : "All"}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading && !error ? <LoadingBlock /> : null}
      {data && !error ? (
        <DataTable columns={columns} rows={data.items} empty={empty} emptyHint={emptyHint} />
      ) : null}
    </div>
  );
}
