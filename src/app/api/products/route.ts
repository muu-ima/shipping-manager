// POST (作成) の body 生成部の meta に追加
// src/app/api/products/route.ts
import { wpFetch } from '@/lib/wp';


export async function GET(request: Request) {
const { searchParams } = new URL(request.url);
const page = searchParams.get('page') ?? '1';
const per_page = searchParams.get('per_page') ?? '20';
const search = searchParams.get('search') ?? '';


const qs = new URLSearchParams({ per_page, page, ...(search ? { search } : {}) });
const res = await wpFetch(`/wp-json/wp/v2/product?${qs.toString()}`);
const data = await res.json();
return Response.json(data);
}


export async function POST(request: Request) {
const body = await request.json();
// WPの product 作成
const created = await (await wpFetch(`/wp-json/wp/v2/product`, {
method: 'POST',
body: JSON.stringify({
title: body.name ?? '',
status: 'publish',
// メタは update 後でも良いが、ACF等なしでも REST で直接渡せる
meta: {
sku: body.sku ?? '',
price: Number(body.price ?? 0),
cost: Number(body.cost ?? 0),
length_cm: Number(body.length_cm ?? 0),
width_cm: Number(body.width_cm ?? 0),
height_cm: Number(body.height_cm ?? 0),
weight_g: Number(body.weight_g ?? 0),
carrier: body.carrier ?? '',
notes: body.notes ?? '',
shipping_actual_yen: body.shipping_actual_yen !== undefined ? Number(body.shipping_actual_yen) : undefined,
volume_cm3: body.volume_cm3 !== undefined ? Number(body.volume_cm3) : undefined,
amazon_size_label: body.amazon_size_label ?? '',
}
}),
})).json();
return Response.json(created, { status: 201 });
}