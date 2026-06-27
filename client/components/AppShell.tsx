"use client";

// Persistent navigation. Pages are grouped the way a dispatcher thinks:
// what's happening now, what came in, and how the agents decided.
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { usePolling } from "../lib/usePolling";

const navGroups = [
  {
    label: "Operations",
    items: [
      { href: "/", label: "Overview" },
      { href: "/incidents", label: "Incidents" },
      { href: "/dispatches", label: "Dispatches" },
      { href: "/resources", label: "Resources" },
      { href: "/alerts", label: "Alerts" }
    ]
  },
  {
    label: "Intake",
    items: [
      { href: "/upload", label: "Upload calls" },
      { href: "/incoming-calls", label: "Incoming calls" },
      { href: "/upload-batches", label: "Upload batches" }
    ]
  },
  {
    label: "Audit",
    items: [
      { href: "/agent-traces", label: "Agent traces" },
      { href: "/system-logs", label: "System logs" },
      { href: "/data-viewer", label: "Data viewer" }
    ]
  }
];

type Health = { ok: boolean; mode?: string; reasoningModel?: string };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = (
    <nav className="space-y-6 px-3 py-5">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="eyebrow mb-1.5 px-2">{group.label}</p>
          {group.items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded px-2 py-1.5 text-sm transition-colors ${
                  active ? "bg-teal-soft font-medium text-teal-dark" : "text-slate hover:bg-paper"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-rule bg-surface lg:flex">
        <Link href="/" className="block border-b border-rule px-5 py-4">
          <Image src="/logo-mark.png" alt="CrisisWeave" width={128} height={76} priority className="h-auto w-[128px]" />
        </Link>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <SystemStatus />
      </aside>

      <header className="sticky top-0 z-[1000] flex items-center justify-between border-b border-rule bg-surface px-4 py-2 lg:hidden">
        <Link href="/">
          <Image src="/logo-mark.png" alt="CrisisWeave" width={88} height={52} className="h-auto w-[88px]" />
        </Link>
        <button
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded border border-rule p-2 text-slate"
        >
          {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>
      {menuOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-[69px] z-[999] overflow-y-auto bg-surface lg:hidden">
          {nav}
          <SystemStatus />
        </div>
      ) : null}

      <div className="lg:pl-56">
        <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

// Footer card telling you whether the API, database and LLM are live.
function SystemStatus() {
  const { data, error } = usePolling<Health>("/health", 15000);
  const online = Boolean(data?.ok) && !error;

  return (
    <div className="border-t border-rule px-5 py-4 text-xs">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${online ? "bg-low" : "bg-critical"}`} />
        <span className="font-medium text-ink">{online ? "API online" : "API unreachable"}</span>
      </div>
      {online ? (
        <dl className="mt-2 space-y-1 font-mono text-[11px] text-muted">
          <div className="flex justify-between gap-2">
            <dt>db</dt>
            <dd className="truncate">{data?.mode === "in-memory" ? "in-memory" : "mongodb atlas"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>llm</dt>
            <dd className="truncate" title={data?.reasoningModel}>
              {data?.reasoningModel?.replace("groq:openai/", "groq · ") || "-"}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
