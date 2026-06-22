import Link from "next/link";
import type React from "react";
import { Badge } from "./Badge";
import { EmptyState } from "./ui";

export type Column<T> = {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  className?: string;
};

export function DataTable<T extends { _id?: string }>({
  columns,
  rows,
  empty = "Nothing here yet.",
  emptyHint
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
  emptyHint?: React.ReactNode;
}) {
  if (!rows.length) {
    return (
      <div className="panel">
        <EmptyState title={empty} hint={emptyHint} />
      </div>
    );
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-rule">
            {columns.map((column) => (
              <th key={column.key} className="eyebrow whitespace-nowrap px-4 py-2.5 text-left font-normal">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row._id || index} className="border-b border-rule/70 last:border-0 hover:bg-paper/60">
              {columns.map((column) => (
                <td key={column.key} className={`max-w-md px-4 py-3 align-top text-ink ${column.className || ""}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IncidentLink({ id, code }: { id?: string; code?: string }) {
  if (!id) return <span className="text-muted">-</span>;
  return (
    <Link className="whitespace-nowrap font-mono text-xs font-medium text-teal hover:underline" href={`/incidents/${id}`}>
      {code || `INC·${id.slice(-6).toUpperCase()}`}
    </Link>
  );
}

// Monospace code like DSP-MVF0… shown in a muted tone.
export function Code({ children }: { children?: React.ReactNode }) {
  return <span className="whitespace-nowrap font-mono text-xs text-slate">{children ?? "-"}</span>;
}

export { Badge };
