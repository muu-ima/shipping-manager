import Link from 'next/link';
import type { WPProduct } from '@/types/wp';
import { headers } from 'next/headers';
import { CATEGORY_LABELS } from '@/features/products/constants';
import type { CategorySlug } from '@/features/products/constants';
import Sidebar from '@/components/Sidebar';

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

/* ===== 型定義（any禁止・WP標準/自作RESTの両対応） ===== */
type ProductMeta = {
  shipping_actual_yen?: number | string;
  length_cm?: number | string;
  width_cm?: number | string;
  height_cm?: number | string;
  weight_g?: number | string;
  applied_weight_g?: number | string;
  carrier?: string;
  amazon_size_label?: string;
  product_category?: string;
  child_category?: string;
};

/* ===== クエリ型 ===== */
type SearchQuery = {
  sheet?: string;
  child_category?: string | string[];
  // 10項目に対応する検索パラメータ
  id?: string;  // ID完全一致
  q?: string;   // 商品名（タイトル）部分一致
  shipping_actual_yen_max?: string;
  weight_g_max?: string;
  applied_weight_g_max?: string;
  carrier?: string;            // 配送業者 完全一致
  amazon_size_label?: string;  // サイズラベル 完全一致
  page?: string;
  per_page?: string;
};

type SearchItem = WPProduct & {
  title?: string | { rendered?: string };
  product_sheet?: Array<{ name: string; slug: string; term_id?: number }>;
  child_category?: string | string[];

  // 自作RESTがトップレベルで返す場合
  shipping_actual_yen?: number | string;
  length_cm?: number | string;
  width_cm?: number | string;
  height_cm?: number | string;
  weight_g?: number | string;
  applied_weight_g?: number | string;
  carrier?: string;
  amazon_size_label?: string;

  // WP標準の meta オブジェクトが来る場合
  meta?: ProductMeta;
};

type SearchResponse = {
  data: SearchItem[];
  meta?: { total: number; pages: number; page: number; perPage: number };
};

function normalizeMeta(p: SearchItem): ProductMeta {
  return {
    shipping_actual_yen: p.meta?.shipping_actual_yen ?? p.shipping_actual_yen,
    length_cm: p.meta?.length_cm ?? p.length_cm,
    width_cm: p.meta?.width_cm ?? p.width_cm,
    height_cm: p.meta?.height_cm ?? p.height_cm,
    weight_g: p.meta?.weight_g ?? p.weight_g,
    applied_weight_g: p.meta?.applied_weight_g ?? p.applied_weight_g,
    carrier: p.meta?.carrier ?? p.carrier,
    amazon_size_label: p.meta?.amazon_size_label ?? p.amazon_size_label,
  };
}

/* ===== データ取得 ===== */
async function getProducts(
  params: Record<string, string | string[] | undefined>
): Promise<SearchResponse> {
  const p = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach((vv) => p.append(k, vv));  // ← 複数 child_category をそのまま append
    } else if (v !== undefined && v !== '') {
      p.set(k, v);
    }
  });

  if (!p.has('per_page')) p.set('per_page', '50');
  if (!p.has('page')) p.set('page', '1');

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/products?${p.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}


function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='group relative inline-flex'>
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2
                   whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white
                   opacity-0 shadow transition-opacity group-hover:opacity-100"
      >
        {label}
      </div>
    </div>
  );
}

export default async function ProductsPage({
  searchParams,
}: { searchParams: Promise<SearchQuery> }) {
  const sp = await searchParams;
  const sheet = (sp.sheet as SheetKey) ?? 'keln';
  const sheetDef = SHEETS.find((s) => s.key === sheet)!;

  // API に渡す検索条件（WP 検索プラグインに中継）
  const apiParams: Record<string, string | string[] | undefined> = {
    product_sheet: String(sheetDef.id),
    child_category: sp.child_category,
    id: sp.id,
    q: sp.q,
    shipping_actual_yen_max: sp.shipping_actual_yen_max,
    weight_g_max: sp.weight_g_max,
    applied_weight_g_max: sp.applied_weight_g_max,
    carrier: sp.carrier,
    amazon_size_label: sp.amazon_size_label,
    page: sp.page,
    per_page: sp.per_page ?? '50',
  };

  const { data: items = [], meta } = await getProducts(apiParams);

  return (
    <main className="h-screen flex flex-row">

      {/* === サイドバー === */}
      <Sidebar sp={sp} sheet={sheet} SHEETS={SHEETS} />
      {/* === メイン === */}
      <section className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* 件数表示 */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">商品一覧</h1>
          <div className="text-sm text-gray-600">
            {meta ? <>該当 <b>{meta.total}</b> 件</> : null}
          </div>
        </div>

        {/* テーブル */}
        <div className="flex-1 overflow-auto rounded-xl border bg-white/70 shadow-sm backdrop-blur">
          <table className="table-fixed w-full text-sm border-collapse">
            <colgroup>
              {/* ID */}<col className="w-[72px]" />
              {/* 商品名 */}<col className="w-[420px]" />
              {/* 送料 */}<col className="w-[120px]" />
              {/* 長さ */}<col className="w-[88px]" />
              {/* 幅 */}<col className="w-[88px]" />
              {/* 高さ */}<col className="w-[88px]" />
              {/* 実重量 */}<col className="w-[120px]" />
              {/* 適用容量 */}<col className="w-[130px]" />
              {/* 配送業者 */}<col className="w-[120px]" />
              {/* サイズラベル */}<col className="w-[240px]" />
              {/* カテゴリ */}<col className="w-[160px]" />
              {/* 編集 */}<col className="w-[84px]" />
            </colgroup>

            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr className="text-left border-b">
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
                <th className="py-2 px-3">カテゴリ</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-gray-500">
                    データがありません
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const title = (typeof p.title === 'string' ? p.title : p.title?.rendered) ?? '-';
                  const metaObj = normalizeMeta(p);

                  // ① meta.product_category → ② meta.child_category → ③ 旧 child_category（トップレベル）
                  const metaCat =
                    (typeof p.meta?.product_category === 'string' && p.meta?.product_category) ||
                    (typeof p.meta?.child_category === 'string' && p.meta?.child_category) ||
                    '';
                  const legacyTop =
                    Array.isArray(p.child_category)
                      ? (p.child_category[0] ?? '')
                      : (typeof p.child_category === 'string' ? p.child_category : '');
                  const categorySlug = (metaCat || legacyTop) as '' | CategorySlug;
                  const categoryLabel =
                    categorySlug ? (CATEGORY_LABELS[categorySlug] ?? categorySlug) : '-';

                  return (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{p.id}</td>
                      <td className="py-2 px-3">{title}</td>
                      <td className="py-2 px-3 text-right whitespace-nowrap tabular-nums">{fmtNum(metaObj.shipping_actual_yen)}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(metaObj.length_cm)}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(metaObj.width_cm)}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(metaObj.height_cm)}</td>
                      <td className="py-2 px-3 text-right whitespace-nowrap tabular-nums">{fmtNum(metaObj.weight_g)}</td>
                      <td className="py-2 px-3 text-right whitespace-nowrap tabular-nums">{fmtNum(metaObj.applied_weight_g)}</td>
                      <td className="py-2 px-3">{fmtTxt(metaObj.carrier)}</td>
                      <td className="py-2 px-3">{fmtTxt(metaObj.amazon_size_label)}</td>
                      <td className="py-2 px-3">{categoryLabel}</td>
                      <td className="py-2 px-3">
                        <Link
                          href={`/products/${p.id}`}
                          prefetch={false}
                          className="text-blue-600 underline"
                        >
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
      </section>
    </main >
  );
}
