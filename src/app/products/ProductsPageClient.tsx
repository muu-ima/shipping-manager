'use client';

import type { WPProduct } from "@/types/wp";
import { CATEGORY_LABELS } from "@/features/products/constants";
import type { CategorySlug } from "@/features/products/constants";
import Sidebar from "@/components/Sidebar";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams} from "next/navigation";

// タブ候補
const SHEETS = [
  { key: "keln", label: "ケルン用", id: 3 },
  { key: "cocconiel", label: "コッコニール用", id: 4 },
  { key: "signpost", label: "サインポスト用", id: 5 },
] as const;
type SheetKey = (typeof SHEETS)[number]["key"];

const fmtNum = (v: unknown) =>
  v == null || v === "" || v === 0 || v === "0" ? "-" : new Intl.NumberFormat("ja-JP").format(Number(v));
const fmtTxt = (v: unknown) => (v == null || v === "" ? "-" : String(v));

type ProductMeta = {
  shipping_actual_yen?: number | string;
  length_cm?: number | string;
  width_cm?: number | string;
  height_cm?: number | string;
  weight_g?: number | string;
  applied_weight_g?: number | string;
  carrier?: string;
  amazon_size_label?: string;
  product_category?: string;
  child_category?: string;
};

type SearchQuery = {
  sheet?: string;
  child_category?: string | string[];
  id?: string;
  q?: string;
  shipping_actual_yen_max?: string;
  weight_g_max?: string;
  applied_weight_g_max?: string;
  carrier?: string;
  amazon_size_label?: string;
  page?: string;
  per_page?: string;
};

type SearchItem = WPProduct & {
  title?: string | { rendered?: string };
  product_sheet?: Array<{ name: string; slug: string; term_id?: number }>;
  child_category?: string | string[];
  shipping_actual_yen?: number | string;
  length_cm?: number | string;
  width_cm?: number | string;
  height_cm?: number | string;
  weight_g?: number | string;
  applied_weight_g?: number | string;
  carrier?: string;
  amazon_size_label?: string;
  meta?: ProductMeta;
};

type SearchResponse = {
  data: SearchItem[];
  meta?: { total: number; pages: number; page: number; perPage: number };
};

function normalizeMeta(p: SearchItem): ProductMeta {
  return {
    shipping_actual_yen: p.meta?.shipping_actual_yen ?? p.shipping_actual_yen,
    length_cm: p.meta?.length_cm ?? p.length_cm,
    width_cm: p.meta?.width_cm ?? p.width_cm,
    height_cm: p.meta?.height_cm ?? p.height_cm,
    weight_g: p.meta?.weight_g ?? p.weight_g,
    applied_weight_g: p.meta?.applied_weight_g ?? p.applied_weight_g,
    carrier: p.meta?.carrier ?? p.carrier,
    amazon_size_label: p.meta?.amazon_size_label ?? p.amazon_size_label,
  };
}

/* ===== データ取得（クライアントなので相対 /api を叩く） ===== */
async function getProducts(params: Record<string, string | string[] | undefined>): Promise<SearchResponse> {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach((vv) => p.append(k, vv));
    else if (v !== undefined && v !== "") p.set(k, v);
  });
  if (!p.has("per_page")) p.set("per_page", "50");
  if (!p.has("page")) p.set("page", "1");

  const res = await fetch(`/api/products?${p.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
}

export default function ProductsPage() {
  const searchParams = useSearchParams();

  // URL → SearchQuery へ整形（useMemoで安定化）
  const sp: SearchQuery = useMemo(() => {
    const get = (k: string) => searchParams.get(k) ?? undefined;
    const getAll = (k: string) => {
      const arr = searchParams.getAll(k);
      return arr.length ? arr : undefined;
    };
    return {
      sheet: get("sheet"),
      child_category: getAll("child_category"),
      id: get("id"),
      q: get("q"),
      shipping_actual_yen_max: get("shipping_actual_yen_max"),
      weight_g_max: get("weight_g_max"),
      applied_weight_g_max: get("applied_weight_g_max"),
      carrier: get("carrier"),
      amazon_size_label: get("amazon_size_label"),
      page: get("page"),
      per_page: get("per_page"),
    };
  }, [searchParams]);

  const sheet = (sp.sheet as SheetKey) ?? "keln";
  const sheetDef = SHEETS.find((s) => s.key === sheet)!;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [meta, setMeta] = useState<SearchResponse["meta"]>();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const apiParams: Record<string, string | string[] | undefined> = {
          product_sheet: String(sheetDef.id),
          child_category: sp.child_category,
          id: sp.id,
          q: sp.q,
          shipping_actual_yen_max: sp.shipping_actual_yen_max,
          weight_g_max: sp.weight_g_max,
          applied_weight_g_max: sp.applied_weight_g_max,
          carrier: sp.carrier,
          amazon_size_label: sp.amazon_size_label,
          page: sp.page,
          per_page: sp.per_page ?? "50",
        };
        const { data, meta } = await getProducts(apiParams);
        setItems(data ?? []);
        setMeta(meta);
      } finally {
        setLoading(false);
      }
    };
    // searchParams が変わるたびに再取得
    fetchData();
    // 依存は URL の実体。toString() で安定化するのが定番
  }, [sheetDef.id, searchParams.toString()]);

  return (
    <main className="h-screen flex flex-row">
      {/* サイドバーに sp をそのまま渡せる */}
      <Sidebar sp={sp} sheet={sheet} SHEETS={SHEETS} />

      <section className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">商品一覧</h1>
          <div className="text-sm text-gray-600">
            {meta ? <>該当 <b>{meta.total}</b> 件</> : null}
          </div>
        </div>

        <div className="flex-1 overflow-auto rounded-xl border bg-white/70 shadow-sm backdrop-blur">
          <table className="table-fixed w-full text-sm border-collapse">
            <colgroup>
              <col className="w-[72px]" />
              <col className="w-[420px]" />
              <col className="w-[120px]" />
              <col className="w-[88px]" />
              <col className="w-[88px]" />
              <col className="w-[88px]" />
              <col className="w-[120px]" />
              <col className="w-[130px]" />
              <col className="w-[120px]" />
              <col className="w-[240px]" />
              <col className="w-[160px]" />
            </colgroup>

            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr className="text-left border-b">
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">商品名</th>
                <th className="py-2 px-3 text-right">送料 (円)</th>
                <th className="py-2 px-3 text-right">長さ (cm)</th>
                <th className="py-2 px-3 text-right">幅 (cm)</th>
                <th className="py-2 px-3 text-right">高さ (cm)</th>
                <th className="py-2 px-3 text-right">実重量 (g)</th>
                <th className="py-2 px-3 text-right">適用容量 (g)</th>
                <th className="py-2 px-3">配送業者</th>
                <th className="py-2 px-3">サイズラベル</th>
                <th className="py-2 px-3">カテゴリ</th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-6 text-center text-gray-500">
                    データがありません
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const title = (typeof p.title === "string" ? p.title : p.title?.rendered) ?? "-";
                  const m = normalizeMeta(p);

                  const metaCat =
                    (typeof p.meta?.product_category === "string" && p.meta?.product_category) ||
                    (typeof p.meta?.child_category === "string" && p.meta?.child_category) ||
                    "";
                  const legacyTop = Array.isArray(p.child_category)
                    ? (p.child_category[0] ?? "")
                    : (typeof p.child_category === "string" ? p.child_category : "");
                  const categorySlug = (metaCat || legacyTop) as "" | CategorySlug;
                  const categoryLabel = categorySlug ? (CATEGORY_LABELS[categorySlug] ?? categorySlug) : "-";

                  return (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{p.id}</td>
                      <td className="py-2 px-3">{title}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{fmtNum(m.shipping_actual_yen)}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(m.length_cm)}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(m.width_cm)}</td>
                      <td className="py-2 px-3 text-right">{fmtNum(m.height_cm)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{fmtNum(m.weight_g)}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{fmtNum(m.applied_weight_g)}</td>
                      <td className="py-2 px-3">{fmtTxt(m.carrier)}</td>
                      <td className="py-2 px-3">{fmtTxt(m.amazon_size_label)}</td>
                      <td className="py-2 px-3">{categoryLabel}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 全画面ローダー */}
      <LoadingOverlay show={loading} message="読み込み中です…" />
    </main>
  );
}
