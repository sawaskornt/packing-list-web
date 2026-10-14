// ============================================================
// Backend URL — proxied via vercel.json in production and
// vite.config.ts in local development to avoid browser CORS.
// Set VITE_API_BASE_URL to override if needed.
// ============================================================
export const REMOTE_BACKEND_URL = 'https://packing-list-1081640935031.us-west1.run.app';
export const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL ?? '';
