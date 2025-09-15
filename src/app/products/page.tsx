// src/app/products/page.tsx
import Link from 'next/link';


async function getProducts() {
const res = await fetch(`${process.env.NEXT_PUBLIC_BASE ?? ''}/api/products`, { cache: 'no-store' });
return res.json();
}

export default async function ProductsPage() {
const items = await getProducts();
return (
<main className="mx-auto max-w-5xl p-6">
<div className="flex items-center justify-between mb-4">
<h1 className="text-2xl font-bold">Products</h1>
<Link href="/products/new" className="rounded-xl bg-black text-white px-4 py-2">新規</Link>
</div>
<div className="overflow-x-auto">
<table className="w-full text-sm">
<thead>
<tr className="text-left border-b">
<th className="py-2 pr-4">ID</th>
<th className="py-2 pr-4">商品名</th>
<th className="py-2 pr-4">SKU</th>
<th className="py-2 pr-4">価格</th>
<th className="py-2 pr-4">重量(g)</th>
<th className="py-2 pr-4"></th>
</tr>
</thead>
<tbody>
{items.map((p: any) => (
<tr key={p.id} className="border-b hover:bg-gray-50">
<td className="py-2 pr-4">{p.id}</td>
<td className="py-2 pr-4">{p.title?.rendered}</td>
<td className="py-2 pr-4">{p.meta?.sku}</td>
<td className="py-2 pr-4">{p.meta?.price}</td>
<td className="py-2 pr-4">{p.meta?.weight_g}</td>
<td className="py-2 pr-4">
<Link className="text-blue-600 underline" href={`/products/${p.id}`}>編集</Link>
</td>
</tr>
))}
</tbody>
</table>
</div>
</main>
);
}