import { QueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";

export function getApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname.match(/\.(replit\.dev|repl\.co|webcontainer\.io)$/)) {
      // If no --PORT suffix, we're behind the Vite proxy — use relative /api (also proxied)
      if (!hostname.match(/--\d+\./)) {
        return "/api";
      }
      // Otherwise strip existing --PORT and attach --8000
      const apiHostname = hostname.replace(/^([^.]+?)(--\d+)?(\..*)$/, "$1--8000$3");
      return `${protocol}//${apiHostname}/api`;
    }
    return `${protocol}//${hostname}:8000/api`;
  }
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000/api";
  }
  return "http://localhost:8000/api";
}

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

async function defaultFetcher(url: string): Promise<unknown> {
  const base = getApiUrl();
  const fullUrl = url.startsWith("http") ? url : `${base}${url}`;
  const headers: Record<string, string> = {};
  if (_authToken) headers["Authorization"] = `Bearer ${_authToken}`;
  const res = await fetch(fullUrl, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const base = getApiUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const headers: Record<string, string> = { ...extraHeaders };
  if (_authToken) headers["Authorization"] = `Bearer ${_authToken}`;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((errBody as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: ({ queryKey }) => defaultFetcher(queryKey[0] as string),
      staleTime: 30_000,
      retry: 1,
    },
  },
});
