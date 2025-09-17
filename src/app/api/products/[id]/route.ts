// src/app/api/products/[id]/route.ts
import type { NextRequest } from 'next/server';
import { wpFetch } from '@/lib/wp';

type Body = {
  title?: string;
  length_cm?: number | string | null;
  width_cm?: number | string | null;
  height_cm?: number | string | null;
  weight_g?: number | string | null;
  volume_cm3?: number | string | null;
  shipping_actual_yen?: number | string | null;
  carrier?: string | null;
  amazon_size_label?: string | null;
  remark?: string | null;
};

const num = (v: unknown): number | undefined => {
  if (v === '' || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const text = (v: unknown): string => (v == null ? '' : String(v));

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const res = await wpFetch(`/wp-json/wp/v2/product/${id}`);
  const json = await res.json();
  return new Response(JSON.stringify(json), { status: res.status });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await req.json()) as Body;

  const payload: Record<string, unknown> = {};
  if (body.title != null) payload.title = text(body.title);

  const metaRaw = {
    length_cm: num(body.length_cm),
    width_cm: num(body.width_cm),
    height_cm: num(body.height_cm),
    weight_g: num(body.weight_g),
    volume_cm3: num(body.volume_cm3),
    shipping_actual_yen: num(body.shipping_actual_yen),
    carrier: body.carrier != null ? text(body.carrier) : undefined,
    amazon_size_label: body.amazon_size_label != null ? text(body.amazon_size_label) : undefined,
    remark: body.remark != null ? text(body.remark) : undefined,
  };
  const meta = Object.fromEntries(Object.entries(metaRaw).filter(([, v]) => v !== undefined));
  if (Object.keys(meta).length) payload.meta = meta;

  const res = await wpFetch(`/wp-json/wp/v2/product/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  return new Response(JSON.stringify(json), { status: res.status });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const res = await wpFetch(`/wp-json/wp/v2/product/${id}?force=true`, { method: 'DELETE' });
  const json = await res.json();
  return new Response(JSON.stringify(json), { status: res.status });
}
