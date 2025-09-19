import Link from 'next/link';
import type { WPProduct } from '@/types/wp';
import { headers } from 'next/headers';

// タブ候補
const SHEETS = [
  { key: 'keln', label: 'ケルン用', id: 3 },
  { key: 'cocconiel', label: 'コッコニール用', id: 4 },
  { key: 'signpost', label: 'サインポスト用', id: 5 },
] as const;
type SheetKey = (typeof SHEETS)[number]['key'];

const fmtNum = (v: unknown) =>
  v === null || v === undefined || v === '' || v === 0 || v === '0'
    ? '-'
    : new Intl.NumberFormat('ja-JP').format(Number(v));

const fmtTxt = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : String(v));

/** 検索APIレスポンス（検索プラグインの形に合わせる） */
type SearchResponse = {
  data: Array<
    WPProduct & {
      title?: string | { rendered?: string };
      product_sheet?: Array<{ name: string; slug: string; term_id?: number }>;
      carrier?: string;
      amazon_size_label?: string;
      shipping_actual_yen?: number;
      length_cm?: number;
      width_cm?: number;
      height_cm?: number;
      weight_g?: number;
      applied_weight_g?: number;
    }
  >;
  meta?: { total: number; pages: number; page: number; perPage: number };
};

async function getProducts(params: Record<string, string | undefined>): Promise<SearchResponse> {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.set(k, v);
  });
  if (!p.has('per_page')) p.set('per_page', '50'); // 既存UIに合わせて 50 件
  if (!p.has('page')) p.set('page', '1');

  // サーバーコンポーネントからは絶対URLで叩く
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/products?${p.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

type SearchQuery = {
  sheet?: string;

  // 10項目に対応する検索パラメータ
  id?: string; // ID完全一致
  q?: string;  // 商品名（タイトル）部分一致
  shipping_actual_yen_min?: string;
  shipping_actual_yen_max?: string;
  length_cm_min?: string;  length_cm_max?: string;
  width_cm_min?: string;   width_cm_max?: string;
  height_cm_min?: string;  height_cm_max?: string;
  weight_g_min?: string;   weight_g_max?: string;
  applied_weight_g_min?: string; applied_weight_g_max?: string;
  carrier?: string;            // 配送業者 完全一致
  amazon_size_label?: string;  // サイズラベル 完全一致

  page?: string; per_page?: string;
};

export default async function ProductsPage({
  searchParams,
}: { searchParams: Promise<SearchQuery> }) {
  const sp = await searchParams;
  const sheet = (sp.sheet as SheetKey) ?? 'keln';
  const sheetDef = SHEETS.find((s) => s.key === sheet)!;

  // API に渡す検索条件（WP 検索プラグインに中継）
  const apiParams: Record<string, string | undefined> = {
    product_sheet: String(sheetDef.id),
    id: sp.id,
    q: sp.q,
    shipping_actual_yen_min: sp.shipping_actual_yen_min,
    shipping_actual_yen_max: sp.shipping_actual_yen_max,
    length_cm_min: sp.length_cm_min,   length_cm_max: sp.length_cm_max,
    width_cm_min: sp.width_cm_min,     width_cm_max: sp.width_cm_max,
    height_cm_min: sp.height_cm_min,   height_cm_max: sp.height_cm_max,
    weight_g_min: sp.weight_g_min,     weight_g_max: sp.weight_g_max,
    applied_weight_g_min: sp.applied_weight_g_min,
    applied_weight_g_max: sp.applied_weight_g_max,
    carrier: sp.carrier,
    amazon_size_label: sp.amazon_size_label,
    page: sp.page,
    per_page: sp.per_page ?? '50',
  };

  const { data: items = [], meta } = await getProducts(apiParams);

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* タブ */}
      <div className="flex items-center mb-4">
        <div className="inline-flex rounded-xl border p-1 bg-white">
          {SHEETS.map((s) => (
            <Link
              key={s.key}
              href={{ pathname: '/products', query: { ...sp, sheet: s.key } }}
              prefetch={false}
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium',
                sheet === s.key ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100',
              ].join(' ')}
            >
              {s.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto">
          <Link href="/products/new" prefetch={false} className="rounded-xl bg-black text-white px-4 py-2">
            新規
          </Link>
        </div>
      </div>

      {/* 絞り込みバー */}
      <form method="get" className="rounded-2xl border bg-white p-4 mb-4">
        <input type="hidden" name="sheet" value={sheet} />
        <div className="grid gap-3 sm:grid-cols-6">
          {/* ID */}
          <input
            name="id"
            defaultValue={sp.id ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="ID"
          />

          {/* 商品名（タイトル） */}
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            className="border rounded-xl px-3 py-2 sm:col-span-2"
            placeholder="商品名（部分一致）"
          />

          {/* 配送業者 */}
          <input
            name="carrier"
            defaultValue={sp.carrier ?? ''}
            className="border rounded-xl px-3 py-2"
            placeholder="配送業者（例: EMS）"
          />

          {/* サイズラベル */}
          <input
            name="amazon_size_label"
            defaultValue={sp.amazon_size_label ?? ''}
            className="border rounded-xl px-3 py-2"
            placeholder="サイズラベル（例: medium）"
          />

          {/* 送料 (円) */}
          <input
            name="shipping_actual_yen_min"
            defaultValue={sp.shipping_actual_yen_min ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="送料 最小(円)"
          />
          <input
            name="shipping_actual_yen_max"
            defaultValue={sp.shipping_actual_yen_max ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="送料 最大(円)"
          />

          {/* 長さ / 幅 / 高さ (cm) */}
          <input
            name="length_cm_min"
            defaultValue={sp.length_cm_min ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="長さ 最小(cm)"
          />
          <input
            name="length_cm_max"
            defaultValue={sp.length_cm_max ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="長さ 最大(cm)"
          />
          <input
            name="width_cm_min"
            defaultValue={sp.width_cm_min ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="幅 最小(cm)"
          />
          <input
            name="width_cm_max"
            defaultValue={sp.width_cm_max ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="幅 最大(cm)"
          />
          <input
            name="height_cm_min"
            defaultValue={sp.height_cm_min ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="高さ 最小(cm)"
          />
          <input
            name="height_cm_max"
            defaultValue={sp.height_cm_max ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="高さ 最大(cm)"
          />

          {/* 実重量 / 適用容量 (g) */}
          <input
            name="weight_g_min"
            defaultValue={sp.weight_g_min ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="実重量 最小(g)"
          />
          <input
            name="weight_g_max"
            defaultValue={sp.weight_g_max ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="実重量 最大(g)"
          />
          <input
            name="applied_weight_g_min"
            defaultValue={sp.applied_weight_g_min ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="適用容量 最小(g)"
          />
          <input
            name="applied_weight_g_max"
            defaultValue={sp.applied_weight_g_max ?? ''}
            inputMode="numeric"
            className="border rounded-xl px-3 py-2"
            placeholder="適用容量 最大(g)"
          />

          <div className="sm:col-span-6 flex items-center gap-3">
            <button type="submit" className="rounded-xl bg-black text-white px-4 py-2">絞り込む</button>
            <Link
              href={{ pathname: '/products', query: { sheet } }}
              prefetch={false}
              className="rounded-xl border px-4 py-2"
            >
              絞り込みをクリア
            </Link>
            <div className="ml-auto text-sm text-gray-600">
              {meta ? <>該当 <b>{meta.total}</b> 件</> : null}
            </div>
          </div>
        </div>
      </form>

      {/* 一覧表 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b bg-gray-100">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">商品名</th>
              <th className="py-2 px-3 text-right">送料 (円)</th>
              <th className="py-2 px-3 text-right">長さ (cm)</th>
              <th className="py-2 px-3 text-right">幅 (cm)</th>
              <th className="py-2 px-3 text-right">高さ (cm)</th>
              <th className="py-2 px-3 text-right">実重量 (g)</th>
              <th className="py-2 px-3 text-right">適用容量 (g)</th>
              <th className="py-2 px-3">配送業者</th>
              <th className="py-2 px-3">サイズラベル</th>
              <th className="py-2 px-3">備考</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-6 text-center text-gray-500">データがありません</td>
              </tr>
            ) : (
              items.map((p) => {
                const title = (typeof p.title === 'string' ? p.title : p.title?.rendered) ?? '-';
                const metaObj = (p as any).meta ?? p;

                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{p.id}</td>
                    <td className="py-2 px-3">{title}</td>
                    <td className="py-2 px-3 text-right">{fmtNum(metaObj?.shipping_actual_yen)}</td>
                    <td className="py-2 px-3 text-right">{fmtNum(metaObj?.length_cm)}</td>
                    <td className="py-2 px-3 text-right">{fmtNum(metaObj?.width_cm)}</td>
                    <td className="py-2 px-3 text-right">{fmtNum(metaObj?.height_cm)}</td>
                    <td className="py-2 px-3 text-right">{fmtNum(metaObj?.weight_g)}</td>
                    <td className="py-2 px-3 text-right">{fmtNum(metaObj?.applied_weight_g)}</td>
                    <td className="py-2 px-3">{fmtTxt(metaObj?.carrier)}</td>
                    <td className="py-2 px-3">{fmtTxt(metaObj?.amazon_size_label)}</td>
                    <td className="py-2 px-3 whitespace-pre-line">{fmtTxt(metaObj?.remark)}</td>
                    <td className="py-2 px-3">
                      <Link href={`/products/${p.id}`} prefetch={false} className="text-blue-600 underline">
                        編集
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
