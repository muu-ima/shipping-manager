// src/lib/wp.ts
const base = process.env.WP_BASE_URL!;
const user = process.env.WP_USER!;
const appPwd = process.env.WP_APP_PASSWORD!;

// 末尾/先頭スラなしで安全に結合
function joinUrl(b: string, p: string) {
  const B = b.replace(/\/+$/, '');
  const P = p.replace(/^\/+/, '');
  return `${B}/${P}`;
}

function authHeader() {
  const token = Buffer.from(`${user}:${appPwd}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

export async function wpFetch(path: string, init?: RequestInit) {
  const url = joinUrl(base, path);
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...(init?.headers || {}),
    },
    // SSR/Route Handlersからのみ使う
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WP ${res.status}: ${text}`);
  }
  return res;
}

/** /wp-json/wp/v2 を自動で付ける */
export function wpV2(path: string) {
  return joinUrl('/wp-json/wp/v2', path);
}

/** 404(rest_no_route) は throw せず null を返す安全版 */
export async function wpTryJson(path: string, init?: RequestInit) {
  try {
    const res = await wpFetch(path, init);
    return await res.json();
  } catch (e: any) {
    const msg = String(e?.message || e || '');
    if (msg.includes('"rest_no_route"') || msg.includes('WP 404')) {
      return null;
    }
    throw e;
  }
}
