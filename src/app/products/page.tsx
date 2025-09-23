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
      <aside className="w-72 shrink-0 border-r bg-white/80 p-6 backdrop-blur overflow-y-auto">
        {/* タブ */}
        <div className="mb-6">
          <div className="flex flex-col gap-2">
            {SHEETS.map((s) => (
              <Link
                key={s.key}
                href={{ pathname: '/products', query: { ...sp, sheet: s.key } }}
                prefetch={false}
                className={[
                  'w-full px-4 py-2 rounded-lg text-sm font-medium text-left',
                  sheet === s.key
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100',
                ].join(' ')}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>


        {/* 絞り込みフォーム */}
        <form method="get" className="space-y-6">
          <input type="hidden" name="sheet" value={sheet} />

          {/* 子カテゴリ */}
          <fieldset>
            <legend className="text-sm font-semibold mb-2">子カテゴリ</legend>
            <div className="flex flex-col gap-2">
              {[
                { slug: 'game-console', label: 'game&console' },
                { slug: 'household', label: 'Household goods' },
                { slug: 'toys', label: 'Toys & Hobbies' },
                { slug: 'electronics', label: 'electronic goods & Camera' },
                { slug: 'wristwatch', label: 'wristwatch' },
                { slug: 'fishing', label: 'fishing gear' },
                { slug: 'anime', label: 'Animation Merchandise' },
                { slug: 'pokemon', label: 'Pokémon' },
                { slug: 'fashion', label: 'Fashion items' },
                { slug: 'other', label: 'Other' },
              ].map((c) => (
                <label key={c.slug} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="child_category"
                    value={c.slug}
                    defaultChecked={
                      Array.isArray(sp.child_category)
                        ? sp.child_category.includes(c.slug)
                        : sp.child_category === c.slug
                    }
                    className="accent-black"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* 基本情報 */}
          <fieldset>
            <legend className="text-sm font-semibold mb-2">基本情報</legend>
            <div className="flex flex-col gap-3">
              <input name="id" defaultValue={sp.id ?? ''} placeholder="ID" className="rounded-md border px-3 py-2 text-sm" />
              <input name="q" defaultValue={sp.q ?? ''} placeholder="商品名" className="rounded-md border px-3 py-2 text-sm" />
              <input name="carrier" defaultValue={sp.carrier ?? ''} placeholder="配送業者" className="rounded-md border px-3 py-2 text-sm" />
              <input name="amazon_size_label" defaultValue={sp.amazon_size_label ?? ''} placeholder="サイズラベル" className="rounded-md border px-3 py-2 text-sm" />
            </div>
          </fieldset>

          {/* 数値フィルター */}
          <fieldset>
            <legend className="text-sm font-semibold mb-2">数値フィルター</legend>
            <div className="flex flex-col gap-3">
              <input name="shipping_actual_yen_max" defaultValue={sp.shipping_actual_yen_max ?? ''} placeholder="送料 最大(円)" className="rounded-md border px-3 py-2 text-sm" />
              <input name="weight_g_max" defaultValue={sp.weight_g_max ?? ''} placeholder="実重量 最大(g)" className="rounded-md border px-3 py-2 text-sm" />
              <input name="applied_weight_g_max" defaultValue={sp.applied_weight_g_max ?? ''} placeholder="適用容量 最大(g)" className="rounded-md border px-3 py-2 text-sm" />
            </div>
          </fieldset>

          {/* アクション */}
          <div className="flex flex-col gap-2">
            <button type="submit" className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:opacity-90">
              絞り込む
            </button>
            <Link href={{ pathname: '/products', query: { sheet } }} prefetch={false} className="text-sm text-gray-500 hover:underline text-center">
              絞り込みをクリア
            </Link>
          </div>
        </form>
      </aside>
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
          <table className="w-full text-sm border-collapse">
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

                  const childCategory = Array.isArray(p.child_category)
                    ? p.child_category.join(', ')
                    : p.child_category ?? '-';

                  return (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{p.id}</td>
                      <td className="py-2 px-3">{title}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(metaObj.shipping_actual_yen)}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(metaObj.length_cm)}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(metaObj.width_cm)}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(metaObj.height_cm)}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(metaObj.weight_g)}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(metaObj.applied_weight_g)}</td>
                      <td className="py-2 px-3">{fmtTxt(metaObj.carrier)}</td>
                      <td className="py-2 px-3">{fmtTxt(metaObj.amazon_size_label)}</td>
                      <td className="py-2 px-3">{childCategory}</td>
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
    </main>
  );
}
