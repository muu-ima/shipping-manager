'use client';

import { useState } from 'react';


type Props = {
initial?: Partial<{
name: string; sku: string; price: number | string; cost: number | string;
length_cm: number | string; width_cm: number | string; height_cm: number | string;
weight_g: number | string; carrier: string; notes: string;
shipping_actual_yen: number | string; volume_cm3: number | string; amazon_size_label: string;
}>;
onSubmit: (values: any) => Promise<void> | void;
submitLabel?: string;
};

export default function ProductForm({ initial = {}, onSubmit, submitLabel = '保存' }: Props) {
const [v, setV] = useState({
name: initial.name ?? '',
sku: initial.sku ?? '',
price: String(initial.price ?? ''),
cost: String(initial.cost ?? ''),
length_cm: String(initial.length_cm ?? ''),
width_cm: String(initial.width_cm ?? ''),
height_cm: String(initial.height_cm ?? ''),
weight_g: String(initial.weight_g ?? ''),
carrier: initial.carrier ?? '',
notes: initial.notes ?? '',
shipping_actual_yen: String((initial as any).shipping_actual_yen ?? ''),
volume_cm3: String((initial as any).volume_cm3 ?? ''),
amazon_size_label: (initial as any).amazon_size_label ?? '',
});

const calcVolume = (l: string, w: string, h: string) => {
const L = Number(l), W = Number(w), H = Number(h);
if (Number.isFinite(L) && Number.isFinite(W) && Number.isFinite(H)) return String(Math.round(L * W * H));
return '';
};

const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
const { name, value } = e.target;
setV((s) => {
const n: any = { ...s, [name]: value };
if (['length_cm','width_cm','height_cm'].includes(name)) n.volume_cm3 = calcVolume(n.length_cm, n.width_cm, n.height_cm);
return n;
});
};

const submit = async (e: React.FormEvent) => {
e.preventDefault();
await onSubmit({
...v,
price: v.price === '' ? undefined : Number(v.price),
cost: v.cost === '' ? undefined : Number(v.cost),
length_cm: v.length_cm === '' ? undefined : Number(v.length_cm),
width_cm: v.width_cm === '' ? undefined : Number(v.width_cm),
height_cm: v.height_cm === '' ? undefined : Number(v.height_cm),
weight_g: v.weight_g === '' ? undefined : Number(v.weight_g),
shipping_actual_yen: v.shipping_actual_yen === '' ? undefined : Number(v.shipping_actual_yen),
volume_cm3: v.volume_cm3 === '' ? undefined : Number(v.volume_cm3),
});
};

const Input = (p: any) => <input {...p} className="border rounded px-3 py-2 w-full" />;

return (
<form onSubmit={submit} className="space-y-4">
<div className="grid sm:grid-cols-2 gap-4">
<div>
<label className="block text-sm mb-1">商品名</label>
<Input name="name" value={v.name} onChange={onChange} placeholder="商品名" required />
</div>
<div>
<label className="block text-sm mb-1">実際送料(¥)</label>
<Input name="shipping_actual_yen" value={v.shipping_actual_yen} onChange={onChange} inputMode="numeric" placeholder="例: 1200" />
</div>
<div>
<label className="block text-sm mb-1">縦(cm)</label>
<Input name="length_cm" value={v.length_cm} onChange={onChange} inputMode="numeric" />
</div>
<div>
<label className="block text-sm mb-1">横(cm)</label>
<Input name="width_cm" value={v.width_cm} onChange={onChange} inputMode="numeric" />
</div>
<div>
<label className="block text-sm mb-1">高さ(cm)</label>
<Input name="height_cm" value={v.height_cm} onChange={onChange} inputMode="numeric" />
</div>
<div>
<label className="block text-sm mb-1">実際の重さ(g)</label>
<Input name="weight_g" value={v.weight_g} onChange={onChange} inputMode="numeric" />
</div>
<div>
<label className="block text-sm mb-1">体積(cm³)</label>
<Input name="volume_cm3" value={v.volume_cm3} onChange={onChange} readOnly />
</div>
<div>
<label className="block text-sm mb-1">配送会社</label>
<Input name="carrier" value={v.carrier} onChange={onChange} placeholder="EMS / FedEx / 小型 など" />
</div>
<div className="sm:col-span-2">
<label className="block text-sm mb-1">Amazonでのサイズ表記</label>
<Input name="amazon_size_label" value={v.amazon_size_label} onChange={onChange} placeholder="例: 20 x 10 x 5 cm; 300 g" />
</div>
<div className="sm:col-span-2">
<label className="block text-sm mb-1">備考</label>
<textarea name="notes" value={v.notes} onChange={onChange} className="border rounded px-3 py-2 w-full" rows={3} />
</div>
</div>
<button type="submit" className="rounded-xl bg-blue-600 text-white px-5 py-2.5">{submitLabel}</button>
</form>
);
}