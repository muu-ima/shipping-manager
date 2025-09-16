// src/app/products/[id]/page.tsx
import ProductForm from '@/components/ProductForm';
import { notFound } from 'next/navigation';
import { wpFetch } from '@/lib/wp';

async function getProduct(id: string) {
  // 数値ID以外は即 404
  if (!/^\d+$/.test(id)) return null;

  try {
    const res = await wpFetch(`/wp-json/wp/v2/product/${id}`);
    return await res.json();
  } catch (e: any) {
    // WP 404(rest_no_route) だけ握りつぶして null
    const msg = String(e?.message || e);
    if (msg.includes('"rest_no_route"') || msg.includes('WP 404')) {
      return null;
    }
    throw e; // それ以外は本当の失敗
  }
}

export default async function EditPage({ params }: { params: { id: string } }) {
  const data = await getProduct(params.id);
  if (!data) return notFound();

  const initial = {
    name: data.title?.rendered ?? '',
    sku: data.meta?.sku ?? '',
    price: data.meta?.price ?? '',
    cost: data.meta?.cost ?? '',
    length_cm: data.meta?.length_cm ?? '',
    width_cm: data.meta?.width_cm ?? '',
    height_cm: data.meta?.height_cm ?? '',
    weight_g: data.meta?.weight_g ?? '',
    carrier: data.meta?.carrier ?? '',
    notes: data.meta?.notes ?? '',
    shipping_actual_yen: data.meta?.shipping_actual_yen ?? '',
    volume_cm3: data.meta?.volume_cm3 ?? '',
    amazon_size_label: data.meta?.amazon_size_label ?? '',
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">商品編集</h1>
      <ProductForm
        initial={initial}
        submitLabel="更新"
        onSubmit={async (values) => {
          await fetch(`/api/products/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
        }}
      />
      <form
        action={`/api/products/${params.id}`}
        method="post"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!confirm('削除しますか？')) return;
          await fetch(`/api/products/${params.id}`, { method: 'DELETE' });
          window.location.href = '/products';
        }}
      >
        <button type="submit" className="rounded-xl bg-red-600 text-white px-4 py-2">削除</button>
      </form>
    </main>
  );
}
