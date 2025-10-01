"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import Tooltip from "@/components/Tooltip";

/* ===== クエリ型 ===== */
type SearchQuery = {
  sheet?: string;
  child_category?: string | string[];
  // 10項目に対応する検索パラメータ
  id?: string; // ID完全一致
  q?: string; // 商品名（タイトル）部分一致
  shipping_actual_yen_max?: string;
  weight_g_max?: string;
  applied_weight_g_max?: string;
  carrier?: string; // 配送業者 完全一致
  amazon_size_label?: string; // サイズラベル 完全一致
  page?: string;
  per_page?: string;
};

type SheetDef = { key: string; label: string; id: number };

export default function Sidebar({
  sp,
  sheet,
  SHEETS,
}: {
  sp: SearchQuery;
  sheet: string;
  SHEETS: readonly SheetDef[];
}) {
  const [open, setOpen] = useState(true);

  // 開閉状態の保存/復元
  useEffect(() => {
    const v = localStorage.getItem("sm:sidebar-open");
    if (v != null) setOpen(v === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("sm:sidebar-open", open ? "1" : "0");
  }, [open]);

  return (
    <aside
      id="sidebar"
      aria-label="サイドバー"
      className={[
        "border-r bg-white/80 backdrop-blur overflow-y-auto transition-[width] duration-300",
        open ? "w-72" : "w-14",
      ].join(" ")}
    >
      {/*　ヘッダー(開閉トグル)　*/}
      <div className="flex h-11 items-center justify-between border-b px-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "サイドバーを閉じる" : "サイドバーを開く"}
          aria-expanded={open}
          aria-controls="sidebar"
          className="group relative  flex items-center justify-center rounded-md p-2 hover:bg-zinc-100 focus:outline-none focus:ring"
        >
          
          <Tooltip label={open ? "サイドバーを閉じる" : "サイドバーを開く"}>
            <span className="inline-flex h-5 w-5 items-center justify-center">
              {open ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </span>
          </Tooltip>
        </button>
        {/* 中央：タイトル（閉じ時はフェード） */}
        <span
          className={`mx-2 select-none text-sm font-semibold transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
        >
          フィルター
        </span>
        {/* 右：左ボタンと同じ幅のダミー（左右バランスを取る） */}
        <span className="inline-block h-9 w-9" />
      </div>

      {/* 中身：閉じているときは非表示＆操作不可 */}
      <div
        className={[
          open ? "px-6 py-6" : "px-2 py-2", // ← ここに移動
          "transition-[opacity] duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        {" "}
        {/* タブ */}
        <div className="mb-6 p-6">
          <div className="flex flex-col gap-2">
            {SHEETS.map((s) => (
              <Link
                key={s.key}
                href={{ pathname: "/products", query: { ...sp, sheet: s.key } }}
                prefetch={false}
                className={[
                  "w-full px-4 py-2 rounded-lg text-sm font-medium text-left",
                  sheet === s.key
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
        {/* 絞り込みフォーム */}
        <form method="get" className="space-y-6 px-6 pb-6">
          <input type="hidden" name="sheet" value={sheet} />

          {/* 子カテゴリ */}
          <fieldset>
            <legend className="text-sm font-semibold mb-2">商品カテゴリ</legend>
            <div className="flex flex-col gap-2">
              {[
                { slug: "game-console", label: "game&console" },
                { slug: "household", label: "Household goods" },
                { slug: "toys", label: "Toys & Hobbies" },
                { slug: "electronics", label: "electronic goods & Camera" },
                { slug: "wristwatch", label: "wristwatch" },
                { slug: "fishing", label: "fishing gear" },
                { slug: "anime", label: "Animation Merchandise" },
                { slug: "pokemon", label: "Pokémon" },
                { slug: "fashion", label: "Fashion items" },
                { slug: "other", label: "Other" },
              ].map((c) => (
                <label
                  key={c.slug}
                  className="inline-flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="child_category"
                    value={c.slug}
                    defaultChecked={
                      Array.isArray(sp.child_category)
                        ? sp.child_category.includes(c.slug)
                        : sp.child_category === c.slug
                    }
                    className="accent-black"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* 基本情報 */}
          <fieldset>
            <legend className="text-sm font-semibold mb-2">基本情報</legend>
            <div className="flex flex-col gap-3">
              <input
                name="id"
                defaultValue={sp.id ?? ""}
                placeholder="ID"
                className="rounded-md border px-3 py-2 text-sm"
              />
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="商品名"
                className="rounded-md border px-3 py-2 text-sm"
              />
              <input
                name="carrier"
                defaultValue={sp.carrier ?? ""}
                placeholder="配送業者"
                className="rounded-md border px-3 py-2 text-sm"
              />
              <input
                name="amazon_size_label"
                defaultValue={sp.amazon_size_label ?? ""}
                placeholder="サイズラベル"
                className="rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </fieldset>

          {/* 数値フィルター */}
          <fieldset>
            <legend className="text-sm font-semibold mb-2">
              数値フィルター
            </legend>
            <div className="flex flex-col gap-3">
              <input
                name="shipping_actual_yen_max"
                defaultValue={sp.shipping_actual_yen_max ?? ""}
                placeholder="送料 最大(円)"
                className="rounded-md border px-3 py-2 text-sm"
              />
              <input
                name="weight_g_max"
                defaultValue={sp.weight_g_max ?? ""}
                placeholder="実重量 最大(g)"
                className="rounded-md border px-3 py-2 text-sm"
              />
              <input
                name="applied_weight_g_max"
                defaultValue={sp.applied_weight_g_max ?? ""}
                placeholder="適用容量 最大(g)"
                className="rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </fieldset>

          {/* アクション */}
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:opacity-90"
            >
              絞り込む
            </button>
            <Link
              href={{ pathname: "/products", query: { sheet } }}
              prefetch={false}
              className="text-sm text-gray-500 hover:underline text-center"
            >
              絞り込みをクリア
            </Link>
          </div>
        </form>
      </div>
    </aside>
  );
}
