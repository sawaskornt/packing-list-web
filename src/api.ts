import { API_BASE_URL, REMOTE_BACKEND_URL } from './config';

let currentUsername: string | null = null;

export function setApiUsername(username: string | null) {
  currentUsername = username;
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}

export function resolveImageUrl(uri?: string | null): string | undefined {
  if (!uri) return undefined;
  if (/^(https?:|data:|blob:)/.test(uri)) return uri;
  if (uri.startsWith('/')) return `${REMOTE_BACKEND_URL}${uri}`;
  return uri;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (currentUsername) {
    headers['x-username'] = encodeURIComponent(currentUsername);
  }
  return fetch(apiUrl(path), { ...options, headers });
}

export async function apiJson(path: string, options: RequestInit = {}): Promise<Response> {
  return apiFetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}

export type UploadResultOrError = { url: string } | { error: string };

export async function uploadImageFile(file: File): Promise<UploadResultOrError> {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    const text = await response.text();
    if (response.ok) {
      const parsed = JSON.parse(text);
      if (typeof parsed?.url === 'string' && parsed.url) {
        return { url: parsed.url };
      }
      return { error: `Server returned no URL (${text.slice(0, 120)})` };
    }
    return { error: `Server error ${response.status}: ${text.slice(0, 120)}` };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}
