const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_URL || "https://jaipurrugs-whatsapp-backend.vercel.app";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const BACKEND_BASE = trimTrailingSlash(BACKEND_ORIGIN);
export const API_WEB_BASE = `${BACKEND_BASE}/api/web`;
export const API_DASHBOARD_BASE = `${BACKEND_BASE}/api`;
export const WS_BASE = `${BACKEND_BASE.replace(/^http/, "ws")}/ws`;
