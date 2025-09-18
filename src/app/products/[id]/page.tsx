import { notFound } from 'next/navigation';
import { wpFetch } from '@/lib/wp';
import EditProductClient from './EditProductClient';
import type { WPProduct } from '@/types/wp';

type Initial = {
  title: string;
  length_cm: number | string | null;
  width_cm: number | string | null;
  height_cm: number | string | null;
  weight_g: number | string | null;
  applied_weight_g: number | string | null;
  shipping_actual_yen: number | string | null;
  carrier: string;
  amazon_size_label: string;
  remark: string;
};

async function getProduct(id: string): Promise<{ id: number; initial: Initial } | null> {
  if (!/^\d+$/.test(id)) return null;

  const res = await wpFetch(`/wp-json/wp/v2/product/${id}`);
  if (!res.ok) return null;

  const p = (await res.json()) as WPProduct;

  return {
    id: p.id,
    initial: {
      title: p.title?.rendered ?? '',
      length_cm: p.meta?.length_cm ?? null,
      width_cm: p.meta?.width_cm ?? null,
      height_cm: p.meta?.height_cm ?? null,
      weight_g: p.meta?.weight_g ?? null,
      applied_weight_g: p.meta?.applied_weight_g ?? null,
      shipping_actual_yen: p.meta?.shipping_actual_yen ?? null,
      carrier: p.meta?.carrier ?? '',
      amazon_size_label: p.meta?.amazon_size_label ?? '',
      remark: p.meta?.remark ?? '',
    },
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const data = await getProduct(params.id);
  if (!data) return notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">商品を編集</h1>
      <EditProductClient id={data.id} initial={data.initial} />
    </main>
  );
}
