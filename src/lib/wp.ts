// src/lib/wp.ts
const base = process.env.WP_BASE_URL!;
const user = process.env.WP_USER!;
const appPwd = process.env.WP_APP_PASSWORD!;


function authHeader() {
const token = Buffer.from(`${user}:${appPwd}`).toString('base64');
return { Authorization: `Basic ${token}` };
}


export async function wpFetch(path: string, init?: RequestInit) {
const url = `${base}${path}`;
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