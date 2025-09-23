'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '@/components/ProductForm';

// ProductForm の props から onSubmit の引数型を逆算
type ProductFormProps = React.ComponentProps<typeof ProductForm>;
type SubmitPayload = Parameters<NonNullable<ProductFormProps['onSubmit']>>[0];

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
};

export default function EditProductClient({ id, initial }: { id: number; initial: Initial }) {
  const router = useRouter();

  const update = async (values: SubmitPayload): Promise<void> => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error(`Update failed: ${res.status}`);
    router.push('/products');
    router.refresh();
  };

  return <ProductForm submitLabel="更新" initial={initial} onSubmit={update} />;
}
