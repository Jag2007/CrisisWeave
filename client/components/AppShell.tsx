"use client";

// App shell owns the persistent navigation and branding used across the demo dashboard.
import Link from "next/link";
import Image from "next/image";
import type React from "react";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BrainCircuit,
  Database,
  FileJson,
  Gauge,
  ListChecks,
  RadioTower,
  Route,
  ScrollText,
  ShieldAlert,
  Truck
} from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: Gauge },
  { href: "/upload", label: "Upload JSON", icon: FileJson },
  { href: "/incoming-calls", label: "Incoming Calls", icon: RadioTower },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
  { href: "/resources", label: "Resources", icon: Truck },
  { href: "/dispatches", label: "Dispatches", icon: Route },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/agent-traces", label: "Agent Traces", icon: BrainCircuit },
  { href: "/system-logs", label: "System Logs", icon: ScrollText },
  { href: "/upload-batches", label: "Upload Batches", icon: ListChecks },
  { href: "/data-viewer", label: "Data Viewer", icon: Database }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white xl:block">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="CrisisWeave logo" width={48} height={48} className="rounded-md object-contain" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-signal">CrisisWeave</p>
              <h1 className="mt-1 text-xl font-bold text-ink">Dynamic Dispatch Grid</h1>
            </div>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="xl:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur xl:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="CrisisWeave logo" width={36} height={36} className="rounded-md object-contain" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-signal">CrisisWeave</p>
                <p className="text-sm font-bold text-ink">Dispatch Grid</p>
              </div>
            </div>
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={pathname}
              onChange={(event) => {
                window.location.href = event.target.value;
              }}
            >
              {navItems.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
