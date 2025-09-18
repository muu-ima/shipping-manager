// src/lib/wp.ts
/**
 * Typed WP fetch helper (no `any`)
 * - Returns `Response`
 * - Adds Basic Auth on the server (if WP_USER / WP_APP_PASS are set)
 * - Prepends NEXT_PUBLIC_WP_ORIGIN to relative WP paths
 */

const WP_ORIGIN = (process.env.NEXT_PUBLIC_WP_ORIGIN ?? '').replace(/\/$/, '');
const isServer = typeof window === 'undefined';

function toHeaderRecord(h?: HeadersInit): Record<string, string> {
  if (!h) return {};
  if (Array.isArray(h)) return Object.fromEntries(h);
  if (typeof Headers !== 'undefined' && h instanceof Headers) {
    const obj: Record<string, string> = {};
    h.forEach((v, k) => (obj[k] = v));
    return obj;
  }
  return { ...(h as Record<string, string>) };
}

function authHeader(): Record<string, string> {
  if (!isServer) return {};
  const user = process.env.WP_USER;
  const pass = process.env.WP_APP_PASS ?? process.env.WP_APP_PASSWORD;
  if (user && pass) {
    const token = Buffer.from(`${user}:${pass}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }
  return {};
}

function withAuth(init?: RequestInit): RequestInit {
  const merged: Record<string, string> = {
    ...toHeaderRecord(init?.headers),
    ...authHeader(),
  };
  return { ...init, headers: merged };
}

function normalizeUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) return input;
  const path = input.startsWith('/') ? input : `/${input}`;
  return `${WP_ORIGIN}${path}`;
}

export async function wpFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = normalizeUrl(input);
  return fetch(url, withAuth(init));
}
