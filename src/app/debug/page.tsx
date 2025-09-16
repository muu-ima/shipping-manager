// src/app/debug/page.tsx
'use client';
import { useEffect, useMemo, useRef } from 'react';
import ProductForm from '@/components/ProductForm';

export default function DebugPage() {
  // 初期値は初回だけ生成（毎レンダで新オブジェクトにしない）
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

  // ページ側のマウント観測（再マウントしてないか確認）
  const idRef = useRef(Math.random().toString(36).slice(2, 7));
  useEffect(() => {
    console.log('[DEBUG/page] mounted', idRef.current);
    return () => console.log('[DEBUG/page] unmounted', idRef.current);
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-xl font-bold">Debug ProductForm</h1>

      {/* ★ key を付けない／Link を置かない／外部データを読まない */}
      <ProductForm
        initial={initial}
        onSubmit={(vals) => {
          console.log('[DEBUG/page] submit', vals);
          alert('submit: ' + JSON.stringify(vals));
        }}
        submitLabel="デバッグ送信"
      />
    </main>
  );
}
