// src/app/products/new/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '@/components/ProductForm';

// ProductForm の props から onSubmit の引数型を逆算
type ProductFormProps = React.ComponentProps<typeof ProductForm>;
type SubmitPayload = Parameters<NonNullable<ProductFormProps['onSubmit']>>[0];

export default function NewProductPage() {
  const router = useRouter();

  const createProduct = async (values: SubmitPayload): Promise<void> => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values), // API側で title/meta 整形する方針に統一
    });
    if (!res.ok) throw new Error(`Failed to create product: ${res.status}`);
    router.push('/products');
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">商品登録</h1>
      <ProductForm submitLabel="作成" onSubmit={createProduct} />
    </main>
  );
}
