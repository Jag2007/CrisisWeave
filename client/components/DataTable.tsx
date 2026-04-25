import Link from "next/link";
import type React from "react";
import { Empty } from "antd";
import { Badge } from "./Badge";

export type Column<T> = {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
};

export function DataTable<T extends { _id?: string }>({
  columns,
  rows,
  empty = "No records yet."
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left font-semibold text-slate-600">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={row._id || index} className="transition-colors duration-150 hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key} className="max-w-md px-4 py-3 align-top text-slate-700">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IncidentLink({ id, code }: { id?: string; code?: string }) {
  if (!id) return <span>-</span>;
  return (
    <Link className="font-semibold text-signal hover:underline" href={`/incidents/${id}`}>
      {code || id.slice(-6)}
    </Link>
  );
}

export { Badge };
