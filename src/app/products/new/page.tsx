// src/app/products/new/page.tsx
'use client';
import ProductForm from '@/components/ProductForm';
import { useRouter } from 'next/navigation';


export default function NewProductPage() {
const router = useRouter();


return (
<main className="mx-auto max-w-3xl p-6">
<h1 className="text-2xl font-bold mb-4">商品登録</h1>
<ProductForm
submitLabel="作成"
onSubmit={async (values) => {
const res = await fetch('/api/products', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(values),
});
if (!res.ok) { alert('作成に失敗しました'); return; }
router.push('/products');
}}
/>
</main>
);
}