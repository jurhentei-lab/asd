type ApiFetchOptions = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> };

const API_BASE = (import.meta.env.VITE_EBMS_API_BASE as string | undefined) ?? '';
const API_TOKEN = (import.meta.env.VITE_EBMS_API_TOKEN as string | undefined) ?? '';

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

