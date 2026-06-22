export function formatDate(value?: string | Date): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatTime(value?: string | Date): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { timeStyle: "short" }).format(new Date(value));
}

// "3 min ago" style text for activity feeds.
export function timeAgo(value?: string | Date): string {
  if (!value) return "-";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return formatDate(value);
}

export function shortId(value?: string): string {
  if (!value) return "-";
  return value.slice(-6).toUpperCase();
}

// FIRE_TRUCK -> "Fire truck"
export function humanize(value?: string): string {
  if (!value) return "-";
  const text = value.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
