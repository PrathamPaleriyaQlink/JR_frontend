const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_URL || "https://api.vultr3.qlink.in";
const WS_BACKEND_ORIGIN =
  import.meta.env.VITE_WS_BACKEND_URL || BACKEND_ORIGIN;

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const BACKEND_BASE = trimTrailingSlash(BACKEND_ORIGIN);
export const WS_BACKEND_BASE = trimTrailingSlash(WS_BACKEND_ORIGIN);
export const API_WEB_BASE = `${BACKEND_BASE}/api/web`;
export const API_DASHBOARD_BASE = `${BACKEND_BASE}/api`;
export const WS_BASE = `${WS_BACKEND_BASE.replace(/^http/, "ws")}/ws`;

/** Parse JSON only when the response is OK and actually JSON (avoids HTML 504 errors). */
export async function parseJsonResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
  }
  if (!contentType.includes("application/json")) {
    const body = await res.text().catch(() => "");
    throw new Error(`Expected JSON but got ${contentType || "unknown"}${body ? `: ${body.slice(0, 120)}` : ""}`);
  }
  return res.json();
}
