// src/app/api/products/[id]/route.ts
import { wpFetch } from '@/lib/wp';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const res = await wpFetch(`/wp-json/wp/v2/product/${params.id}`);
  const data = await res.json();
  return Response.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const updated = await (
    await wpFetch(`/wp-json/wp/v2/product/${params.id}`, {
      method: 'POST',
      body: JSON.stringify({ meta: { ...body } }),
    })
  ).json();
  return Response.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await wpFetch(`/wp-json/wp/v2/product/${params.id}?force=true`, {
    method: 'DELETE',
  });
  return new Response(null, { status: 204 });
}
