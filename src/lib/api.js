// ============================================================
// Backend configuration. VITE_API_URL points at the Express server;
// VITE_API_ACCESS_TOKEN is sent on the endpoints that spend Outscraper
// credits when the backend defines API_ACCESS_TOKEN.
// ============================================================

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
export const API_ACCESS_TOKEN = import.meta.env.VITE_API_ACCESS_TOKEN || "";

// Cabeceras con el token de acceso (si está configurado en el .env).
export const authHeaders = () =>
  API_ACCESS_TOKEN ? { "x-access-token": API_ACCESS_TOKEN } : {};
