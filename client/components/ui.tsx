// Small building blocks shared by every page. Kept deliberately plain.
import type React from "react";

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "secondary",
  disabled,
  type = "button"
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const styles =
    variant === "primary"
      ? "bg-teal text-white hover:bg-teal-dark border-teal"
      : "bg-surface text-ink hover:bg-paper border-rule";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center gap-2 rounded border px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

export function Panel({
  title,
  aside,
  children,
  flush
}: {
  title?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="panel">
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-rule px-4 py-2.5">
          <h2 className="eyebrow !text-slate">{title}</h2>
          {aside}
        </div>
      ) : null}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: React.ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

// Shown when the backend can't be reached, with what to check.
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="panel border-l-[3px] border-l-critical p-5">
      <p className="font-semibold text-ink">Can&apos;t reach the CrisisWeave API</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      <p className="mt-3 text-sm text-muted">
        Check that the backend is running and that <code className="font-mono text-xs">BACKEND_API_URL</code> points
        to it. A sleeping free-tier server can take up to a minute to wake up.
      </p>
      {onRetry ? (
        <div className="mt-4">
          <Button onClick={onRetry}>Try again</Button>
        </div>
      ) : null}
    </div>
  );
}

export function LoadingBlock({ rows = 6 }: { rows?: number }) {
  return (
    <div className="panel space-y-3 p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton h-4" style={{ width: `${90 - (index % 3) * 15}%` }} />
      ))}
    </div>
  );
}
