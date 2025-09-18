import Link from 'next/link';
import { wpFetch } from '@/lib/wp';
import type { WPProduct } from '@/types/wp';

// タブ候補
const SHEETS = [
  { key: 'keln', label: 'ケルン用', id: 3 },
  { key: 'cocconiel', label: 'コッコニール用', id: 4 },
  { key: 'signpost', label: 'サインポスト用', id: 5 },
] as const;
type SheetKey = (typeof SHEETS)[number]['key'];

async function getProducts(sheet: SheetKey): Promise<WPProduct[]> {
  const sheetDef = SHEETS.find((s) => s.key === sheet)!;
  const qs = new URLSearchParams({ per_page: '50', product_sheet: String(sheetDef.id) });
  const res = await wpFetch(`/wp-json/wp/v2/product?${qs.toString()}`, { cache: 'no-store' } as RequestInit);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

const fmtNum = (v: unknown) =>
  v === null || v === undefined || v === '' || v === 0 || v === '0'
    ? '-'
    : new Intl.NumberFormat('ja-JP').format(Number(v));

const fmtTxt = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : String(v));

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ sheet?: string }>;
}) {
  const sp = await searchParams;
  const sheet = (sp.sheet as SheetKey) ?? 'keln';

  const items = await getProducts(sheet);

  return (
    <main className="mx-auto max-w-6xl p-6">
      {/* タブ */}
      <div className="flex items-center mb-4">
        <div className="inline-flex rounded-xl border p-1 bg-white">
          {SHEETS.map((s) => (
            <Link
              key={s.key}
              href={`/products?sheet=${s.key}`}
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
              items.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{p.id}</td>
                  <td className="py-2 px-3">{p.title?.rendered ?? '-'}</td>
                  <td className="py-2 px-3 text-right">{fmtNum(p.meta?.shipping_actual_yen)}</td>
                  <td className="py-2 px-3 text-right">{fmtNum(p.meta?.length_cm)}</td>
                  <td className="py-2 px-3 text-right">{fmtNum(p.meta?.width_cm)}</td>
                  <td className="py-2 px-3 text-right">{fmtNum(p.meta?.height_cm)}</td>
                  <td className="py-2 px-3 text-right">{fmtNum(p.meta?.weight_g)}</td>
                  <td className="py-2 px-3 text-right">{fmtNum(p.meta?.applied_weight_g)}</td>
                  <td className="py-2 px-3">{fmtTxt(p.meta?.carrier)}</td>
                  <td className="py-2 px-3">{fmtTxt(p.meta?.amazon_size_label)}</td>
                  <td className="py-2 px-3 whitespace-pre-line">{fmtTxt(p.meta?.remark)}</td>
                  <td className="py-2 px-3">
                    <Link href={`/products/${p.id}`} prefetch={false} className="text-blue-600 underline">
                      編集
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
