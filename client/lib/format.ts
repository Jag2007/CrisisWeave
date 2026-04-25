export function formatDate(value?: string | Date): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function shortId(value?: string): string {
  if (!value) return "-";
  return value.slice(-6).toUpperCase();
}
