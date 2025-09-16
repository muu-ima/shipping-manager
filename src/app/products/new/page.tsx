'use client';
import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  const router = useRouter();

  // 初回だけ固定
  const initial = useMemo(() => ({
    title: '',
    shipping_actual_yen: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    weight_g: '',
    volume_cm3: '',
    carrier: '',
    amazon_size_label: '',
  }), []);

  const handleSubmit = useCallback(async (values: any) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error('create failed');
    router.push('/products');
  }, [router]);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">商品登録</h1>
      <ProductForm initial={initial} onSubmit={handleSubmit} submitLabel="作成" />
    </main>
  );
}
