// src/app/products/page.tsx
import Link from 'next/link';
import { wpFetch } from '@/lib/wp';

async function getProducts() {
  const res = await wpFetch('/wp-json/wp/v2/product?per_page=50', {
    // 常に最新を取る
    // @ts-ignore
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

export default async function ProductsPage() {
  const items = await getProducts();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/products/new"
          prefetch={false}
          className="rounded-xl bg-black text-white px-4 py-2"
        >
          新規
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left border-b bg-gray-100">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">商品名</th>
              <th className="py-2 px-3 text-right">送料 (円)</th>
              <th className="py-2 px-3 text-right">重さ (g)</th>
              <th className="py-2 px-3 text-right">体積 (cm³)</th>
              <th className="py-2 px-3">配送業者</th>
              <th className="py-2 px-3">サイズラベル</th>
              <th className="py-2 px-3">備考</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p: any) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">{p.id}</td>
                <td className="py-2 px-3">{p.title?.rendered ?? '-'}</td>
                <td className="py-2 px-3 text-right">
                  {p.meta?.shipping_actual_yen ?? '-'}
                </td>
                <td className="py-2 px-3 text-right">{p.meta?.weight_g ?? '-'}</td>
                <td className="py-2 px-3 text-right">
                  {p.meta?.volume_cm3 ?? '-'}
                </td>
                <td className="py-2 px-3">{p.meta?.carrier ?? '-'}</td>
                <td className="py-2 px-3">{p.meta?.amazon_size_label ?? '-'}</td>
                <td className="py-2 px-3 whitespace-pre-line">
                  {p.meta?.remark ?? '-'}
                </td>
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
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
