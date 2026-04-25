// Live ETA helpers turn stored dispatch timestamps into a continuously refreshed dashboard label.
export function liveEtaText(dispatchedAt: unknown, estimatedArrivalMinutes: unknown): string {
  const eta = Number(estimatedArrivalMinutes);
  if (!Number.isFinite(eta)) return "-";

  const dispatchedTime = dispatchedAt ? new Date(String(dispatchedAt)).getTime() : Number.NaN;
  if (!Number.isFinite(dispatchedTime)) {
    return `${Math.round(eta)} min ETA`;
  }

  const elapsedMinutes = Math.max(0, (Date.now() - dispatchedTime) / 60000);
  const remaining = Math.max(0, eta - elapsedMinutes);
  if (remaining <= 0.5) {
    return "Arriving now";
  }

  return `${Math.ceil(remaining)} min remaining`;
}
