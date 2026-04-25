// Small API client used by the dashboard. All requests are no-store so live
// polling always reflects the current backend/MongoDB state.
const API_BASE_URL = normalizeApiBase(process.env.NEXT_PUBLIC_API_BASE_URL);

export type ApiListResponse<T> = {
  ok: boolean;
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(buildApiUrl(path), { cache: "no-store" });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(extractApiMessage(text) || `API request failed: ${response.status}`);
  }
  return response.json();
}

export async function apiPost<T>(path: string, body?: BodyInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    body
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(extractApiMessage(text) || `API request failed: ${response.status}`);
  }
  return response.json();
}

export async function apiPostJson<T>(path: string, payload?: unknown): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(extractApiMessage(text) || `API request failed: ${response.status}`);
  }
  return response.json();
}

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function normalizeApiBase(value?: string): string {
  const raw = value?.trim();

  if (!raw || raw === "/") {
    return "/api";
  }

  const withoutTrailingSlash = raw.replace(/\/+$/, "");
  return withoutTrailingSlash.endsWith("/api") ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
}

function extractApiMessage(text: string): string {
  if (text.includes("Cannot GET")) {
    return "Frontend is connected, but API routing is not pointing to the Express backend. Set BACKEND_API_URL on the frontend service or NEXT_PUBLIC_API_BASE_URL to the backend /api URL.";
  }

  try {
    const parsed = JSON.parse(text) as { message?: string };
    return parsed.message || text;
  } catch {
    return text;
  }
}
