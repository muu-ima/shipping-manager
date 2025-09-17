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

    // 必須: タイトル
    const title = (body.title ?? body.name ?? '').toString().trim();
    if (!title) {
        return new Response(JSON.stringify({ error: 'title is required' }), { status: 400 });
    }

    // ヘルパー: 数値は未入力なら送らない（0を強制しない）
    const num = (v: any) => {
        if (v === '' || v === null || v === undefined) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    };
    const text = (v: any) => (v ?? '').toString();

    // 使うメタだけ、キー名はWPプラグインと完全一致（notes→remark / price削除）
    const metaRaw = {
        // price: num(body.price), // ←不要なので送らない
        cost: num(body.cost),
        length_cm: num(body.length_cm),
        width_cm: num(body.width_cm),
        height_cm: num(body.height_cm),
        weight_g: num(body.weight_g),
        volume_cm3: num(body.volume_cm3),
        shipping_actual_yen: num(body.shipping_actual_yen),
        carrier: text(body.carrier),
        amazon_size_label: text(body.amazon_size_label),
        remark: text(body.remark), // ← ここが備考。notesは使わない
    };

    // undefined の項目は送らない（WP側に余計な0が入りにくくなる）
    const meta = Object.fromEntries(Object.entries(metaRaw).filter(([, v]) => v !== undefined));

    const res = await wpFetch(`/wp-json/wp/v2/product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status: 'publish', meta }),
    });

    const created = await res.json();
    return new Response(JSON.stringify(created), { status: res.status });
}
