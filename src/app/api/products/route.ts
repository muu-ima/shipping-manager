// src/app/api/products/route.ts
import { wpFetch } from '@/lib/wp';

type IncomingProductBody = {
  title?: string;
  name?: string;
  cost?: number | string | null;
  length_cm?: number | string | null;
  width_cm?: number | string | null;
  height_cm?: number | string | null;
  weight_g?: number | string | null;
  applied_weight_g?: number | string | null;
  shipping_actual_yen?: number | string | null;
  carrier?: string | null;
  amazon_size_label?: string | null;
  remark?: string | null;
  product_sheet?: number[];
};

export async function GET(request: Request) {
  const url = new URL(request.url);

  // 受け取ったクエリをそのまま転送（空は除外）
  const params = new URLSearchParams();
  url.searchParams.forEach((v, k) => {
    if (v !== '') params.set(k, v);
  });

  // デフォルト
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('per_page')) params.set('per_page', '20');

  // ★ WP標準の /wp/v2/product ではなく、検索用プラグインのRESTを叩く
  const res = await wpFetch(`/wp-json/shipping/v1/search?${params.toString()}`);

  const data = await res.json();
  // 検索RESTのレスポンス（{ data, meta }）をそのまま返す
  return new Response(JSON.stringify(data), { status: res.status });
}

export async function POST(request: Request) {
  const body = (await request.json()) as IncomingProductBody;

  // 必須: タイトル（name フォールバック）
  const title = (body.title ?? body.name ?? '').toString().trim();
  if (!title) {
    return new Response(JSON.stringify({ error: 'title is required' }), { status: 400 });
  }

  // 数値: 未入力は送らない（0強制しない）
  const num = (v: unknown): number | undefined => {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  // 文字列
  const text = (v: unknown): string => (v == null ? '' : String(v));

  // WPプラグインのキー名と完全一致
  const metaRaw = {
    cost: num(body.cost),
    length_cm: num(body.length_cm),
    width_cm: num(body.width_cm),
    height_cm: num(body.height_cm),
    weight_g: num(body.weight_g),
    applied_weight_g: num(body.applied_weight_g),
    shipping_actual_yen: num(body.shipping_actual_yen),
    carrier: text(body.carrier),
    amazon_size_label: text(body.amazon_size_label),
    remark: text(body.remark),
  } satisfies Record<string, unknown>;

  // undefined は落として送る
  const meta = Object.fromEntries(Object.entries(metaRaw).filter(([, v]) => v !== undefined));

  const product_sheet =
    Array.isArray(body.product_sheet)
      ? body.product_sheet.map((v) => Number(v)).filter((n) => Number.isFinite(n))
      : undefined;

  console.log('POST body', { title, meta });
  const res = await wpFetch(`/wp-json/wp/v2/product`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, status: 'publish', meta,
        ...(product_sheet && product_sheet.length ? { product_sheet } : {}), 
     }),
  });

  const created = await res.json();
  return new Response(JSON.stringify(created), { status: res.status });
}
