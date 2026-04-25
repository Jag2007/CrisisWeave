const colorMap: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  LOW: "bg-emerald-100 text-emerald-800 border-emerald-200",
  AVAILABLE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  BUSY: "bg-sky-100 text-sky-800 border-sky-200",
  DISPATCHED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DISPATCH_PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  SENT: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PENDING: "bg-slate-100 text-slate-700 border-slate-200"
};

export function Badge({ value }: { value?: string }) {
  const label = value || "-";
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${colorMap[label] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
      {label.replaceAll("_", " ")}
    </span>
  );
}
