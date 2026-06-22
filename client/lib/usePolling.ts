"use client";

// Fetches an API path and re-fetches it every few seconds, so pages show the agent
// pipeline's progress live without websockets. Pass null to skip fetching.
import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "./api";

export function usePolling<T>(path: string | null, intervalMs = 3000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const lastSnapshot = useRef("");

  const load = useCallback(async () => {
    if (!path) return;
    try {
      const next = await apiGet<T>(path);
      // Only re-render when the payload actually changed.
      const snapshot = JSON.stringify(next);
      if (snapshot !== lastSnapshot.current) {
        lastSnapshot.current = snapshot;
        setData(next);
      }
      setError(null);
    } catch (err) {
      // Keep showing old data if a single poll fails; only surface the error when we have nothing.
      if (!lastSnapshot.current) {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    lastSnapshot.current = "";
    setData(null);
    setLoading(Boolean(path));
    void load();
    const timer = window.setInterval(() => void load(), intervalMs);
    return () => window.clearInterval(timer);
  }, [load, path, intervalMs]);

  return { data, error, loading, reload: load };
}
