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
  volume_cm3?: number | string | null;
  shipping_actual_yen?: number | string | null;
  carrier?: string | null;
  amazon_size_label?: string | null;
  remark?: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') ?? '1';
  const per_page = searchParams.get('per_page') ?? '20';
  const search = searchParams.get('search') ?? '';

  const qs = new URLSearchParams({ per_page, page, ...(search ? { search } : {}) });
  const res = await wpFetch(`/wp-json/wp/v2/product?${qs.toString()}`);
  const data = await res.json();
  return new Response(JSON.stringify(data), { status: res.status });
}

export async function POST(request: Request) {
  const body = (await request.json()) as IncomingProductBody;

  // 必須: タイトル（name が来たらフォールバック）
  const title = (body.title ?? body.name ?? '').toString().trim();
  if (!title) {
    return new Response(JSON.stringify({ error: 'title is required' }), { status: 400 });
  }

  // ヘルパー: 数値は未入力なら送らない（0を強制しない）
  const num = (v: unknown): number | undefined => {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const text = (v: unknown): string => (v == null ? '' : String(v));

  // WPプラグインのキーと完全一致（price/notesは使わない）
  const metaRaw = {
    cost: num(body.cost),
    length_cm: num(body.length_cm),
    width_cm: num(body.width_cm),
    height_cm: num(body.height_cm),
    weight_g: num(body.weight_g),
    volume_cm3: num(body.volume_cm3),
    shipping_actual_yen: num(body.shipping_actual_yen),
    carrier: text(body.carrier),
    amazon_size_label: text(body.amazon_size_label),
    remark: text(body.remark),
  } satisfies Record<string, unknown>;

  // undefined を落としてから送る
  const meta = Object.fromEntries(Object.entries(metaRaw).filter(([, v]) => v !== undefined));

  const res = await wpFetch(`/wp-json/wp/v2/product`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, status: 'publish', meta }),
  });

  const created = await res.json();
  return new Response(JSON.stringify(created), { status: res.status });
}
