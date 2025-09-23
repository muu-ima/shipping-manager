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
  product_sheet?: number[];

  // 互換フィールド
  child_category?: string | null;      // 旧UIが送ってくる
  product_category?: string | null;    // 新（将来UIで直接送る場合）
};

export async function GET(request: Request) {
  const url = new URL(request.url);

  // ---- 互換: child_category -> product_category に正規化（配列/CSV両対応） ----
  const params = new URLSearchParams();

  // まず全パラメータを拾う（空は除外）
  url.searchParams.forEach((v, k) => {
    if (v !== '') params.append(k, v);
  });

  // child_category[]=a&child_category[]=b / child_category=a,b の両方を拾う
  const childArr = url.searchParams.getAll('child_category'); // 繰り返しキー
  const childCsv = url.searchParams.get('child_category');    // CSV
  const cats: string[] = [];
  if (childArr.length) cats.push(...childArr);
  if (childCsv) cats.push(...childCsv.split(',').map(s => s.trim()).filter(Boolean));

  if (cats.length) {
    // 検索プラグイン側は product_category を見るようにしてある（WP側フィルタで対応済み）
    params.set('product_category', cats.join(','));
    // 旧キーは転送しない（ダブり防止）
    params.delete('child_category');
  }

  // デフォルト
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('per_page')) params.set('per_page', '20');

  // ★ 検索用プラグインのRESTを叩く（shipping/v1/search）
  const res = await wpFetch(`/wp-json/shipping/v1/search?${params.toString()}`);
  const payload = await res.json();

  // payload 形: { data: WPProduct[], meta: {...} } を想定
  // 応答も互換: product_category を child_category にミラー
  if (payload?.data && Array.isArray(payload.data)) {
    payload.data = payload.data.map((it: any) => {
      if (it?.meta?.product_category && !it?.meta?.child_category) {
        it.meta.child_category = it.meta.product_category;
      }
      return it;
    });
  }

  return new Response(JSON.stringify(payload), { status: res.status });
}

export async function POST(request: Request) {
  const body = (await request.json()) as IncomingProductBody;

  // 必須: タイトル（name フォールバック）
  const title = (body.title ?? body.name ?? '').toString().trim();
  if (!title) {
    return new Response(JSON.stringify({ error: 'title is required' }), { status: 400 });
  }

  // ---- 互換: child_category -> product_category に正規化 ----
  const product_category =
    (body.product_category ?? body.child_category ?? '').toString().trim();

  // 数値: 未入力は送らない（0強制しない）
  const num = (v: unknown): number | undefined => {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  // 文字列
  const text = (v: unknown): string => (v == null ? '' : String(v));

  // WPプラグインのキー名と完全一致（undefined は落として送る）
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


    // 新メタ：互換で正規化した product_category を保存
    product_category: product_category || undefined,
  } satisfies Record<string, unknown>;

  const meta = Object.fromEntries(Object.entries(metaRaw).filter(([, v]) => v !== undefined));

  const product_sheet =
    Array.isArray(body.product_sheet)
      ? body.product_sheet.map((v) => Number(v)).filter((n) => Number.isFinite(n))
      : undefined;

  const res = await wpFetch(`/wp-json/wp/v2/product`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      status: 'publish',
      meta,
      ...(product_sheet && product_sheet.length ? { product_sheet } : {}),
    }),
  });

  const created = await res.json();

  // 応答も互換: product_category を child_category にミラー
  if (created?.meta?.product_category && !created?.meta?.child_category) {
    created.meta.child_category = created.meta.product_category;
  }

  return new Response(JSON.stringify(created), { status: res.status });
}
