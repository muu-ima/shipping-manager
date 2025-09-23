// src/app/forms/new/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '@/components/ProductForm';

// ProductForm の props から onSubmit の引数型を逆算
type ProductFormProps = React.ComponentProps<typeof ProductForm>;
type SubmitPayload = Parameters<NonNullable<ProductFormProps['onSubmit']>>[0];

export default function SecretFormPage() {
  const router = useRouter();

  // ページ表示時にパスコード確認（localStorage）
  useEffect(() => {
    const pass = localStorage.getItem('form_pass');
    if (pass !== process.env.NEXT_PUBLIC_FORM_SECRET) {
      router.replace('/forms/entry'); // 認証ページに飛ばす
    }
  }, [router]);

  const createProduct = async (values: SubmitPayload): Promise<void> => {
    // payload に secret を追加して API 側で二重チェック
    const payload = {
      ...values,
      secret: process.env.NEXT_PUBLIC_FORM_SECRET!,
    };

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to create product: ${res.status}`);
    router.push('/products');
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">発送情報入力フォーム（シークレット）</h1>
      <ProductForm submitLabel="作成" onSubmit={createProduct} />
    </main>
  );
}
