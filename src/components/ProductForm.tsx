'use client';

import React, { useEffect, useRef, useState } from 'react';

const SHEETS = [
    { key: 'keln', label: 'ケルン用', id: 3 },
    { key: 'cocconiel', label: 'コッコニール用', id: 4 },
    { key: 'signpost', label: 'サインポスト用', id: 5 },
] as const;
type SheetKey = (typeof SHEETS)[number]['key'];

type NumericKeys =
    | 'shipping_actual_yen'
    | 'length_cm'
    | 'width_cm'
    | 'height_cm'
    | 'weight_g'
    | 'applied_weight_g';

type FormState = {
    title: string;
    shipping_actual_yen: string; // ← 入力中は string で保持
    length_cm: string;
    width_cm: string;
    height_cm: string;
    weight_g: string;
    applied_weight_g: string;
    carrier: string;
    amazon_size_label: string;
    remark: string;
};

type SubmitPayload = {
    title: string;
    shipping_actual_yen: number | null;
    length_cm: number | null;
    width_cm: number | null;
    height_cm: number | null;
    weight_g: number | null;
    applied_weight_g: number | null;
    carrier: string;
    amazon_size_label: string;
    remark: string;
    product_sheet: number[];
};

type Props = {
    initial?: Partial<Record<keyof FormState, string | number | null>>;
    submitLabel?: string;
    onSubmit: (payload: SubmitPayload) => Promise<void> | void;
    onCancel?: () => void;
    defaultSheetKey?: SheetKey;
};

/** 空 or 非数なら null */
function toNumOrNull(s: string): number | null {
    const t = (s ?? '').toString().trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
}

/** 途中状態を許容しつつ数字/小数/マイナスのみ残す（全角→半角も） */
function normalizeNumericInput(s: string): string {
    let t = (s ?? '').toString().replace(/^\s+|\s+$/g, '');
    t = t.replace(/[０-９．－]/g, (ch) =>
        '０１２３４５６７８９．－'.includes(ch)
            ? '0123456789.-'['０１２３４５６７８９．－'.indexOf(ch)]
            : ch
    );
    t = t.replace(/[^0-9.\-]/g, '');
    if (t.includes('-')) {
        t = (t.startsWith('-') ? '-' : '') + t.replace(/-/g, '').replace(/^-/, '');
    }
    const i = t.indexOf('.');
    if (i >= 0) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, '');
    return t;
}

export default function ProductForm({
    initial,
    submitLabel = '保存',
    onSubmit,
    onCancel,
    defaultSheetKey = 'keln',
}: Props) {
    const [sheetKey, setSheetKey] = useState<SheetKey>(defaultSheetKey);
    const sheetId = SHEETS.find((s) => s.key === sheetKey)!.id;
    const [form, setForm] = useState<FormState>(() => ({
        title: (initial?.title ?? '') as string,
        shipping_actual_yen:
            initial?.shipping_actual_yen != null ? String(initial.shipping_actual_yen) : '',
        length_cm: initial?.length_cm != null ? String(initial.length_cm) : '',
        width_cm: initial?.width_cm != null ? String(initial.width_cm) : '',
        height_cm: initial?.height_cm != null ? String(initial.height_cm) : '',
        weight_g: initial?.weight_g != null ? String(initial.weight_g) : '',
        applied_weight_g: initial?.applied_weight_g != null ? String(initial.applied_weight_g) : '',
        carrier: (initial?.carrier ?? '') as string,
        amazon_size_label: (initial?.amazon_size_label ?? '') as string,
        remark: (initial?.remark ?? '') as string,
    }));

    /** 編集中の key（計算が打鍵を潰さないように） */
    const editingKeyRef = useRef<keyof FormState | null>(null);

    // ★ これを追加（前回の寸法キーを保持）
    const prevDimsRef = useRef<string>('');

    // ★ これを追加（現在の寸法キー）
    const dimsKey = `${form.length_cm}|${form.width_cm}|${form.height_cm}`;

    const setField = (key: keyof FormState, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const onTextChange =
        (key: Exclude<keyof FormState, NumericKeys>) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                editingKeyRef.current = key;
                setField(key, e.target.value);
            };

    const onNumberChange =
        (key: NumericKeys) =>
            (e: React.ChangeEvent<HTMLInputElement>) => {
                editingKeyRef.current = key;
                setField(key, normalizeNumericInput(e.target.value));
            };

    /*
 * 計算ルール
 * - 実際の重さ (g) = ユーザーが手入力
 * - 体積 (cm³) = 長さ×幅×高さ を自動計算
 */
    useEffect(() => {
        const t = setTimeout(() => {
            const L = toNumOrNull(form.length_cm);
            const W = toNumOrNull(form.width_cm);
            const H = toNumOrNull(form.height_cm);

            if (L != null && W != null && H != null) {
                const applied = Math.round((L * W * H) / 5);
                setField('applied_weight_g', String(applied));
            } else {
                setField('applied_weight_g', '');
            }
        }, 200);

        return () => clearTimeout(t);
    }, [form.length_cm, form.width_cm, form.height_cm]);

    const onBlurAny = () => {
        editingKeyRef.current = null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: SubmitPayload = {
            title: form.title.trim(),
            shipping_actual_yen: toNumOrNull(form.shipping_actual_yen),
            length_cm: toNumOrNull(form.length_cm),
            width_cm: toNumOrNull(form.width_cm),
            height_cm: toNumOrNull(form.height_cm),
            weight_g: toNumOrNull(form.weight_g),
            applied_weight_g: toNumOrNull(form.applied_weight_g),
            carrier: form.carrier.trim(),
            amazon_size_label: form.amazon_size_label.trim(),
            remark: form.remark.trim(),
            product_sheet: [sheetId],
        };
        await onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="inline-flex rounded-xl border p-1 bg-white">
                {SHEETS.map((s) => (
                    <button
                        key={s.key}
                        type="button"
                        onClick={() => setSheetKey(s.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${sheetKey === s.key ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className="text-sm text-gray-600">商品名（title）</span>
                    <input
                        className="rounded-md border px-3 py-2"
                        value={form.title}
                        onChange={onTextChange('title')}
                        placeholder="例：Tシャツ"
                        required
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">実送料（円）</span>
                    <input
                        className="rounded-md border px-3 py-2"
                        inputMode="decimal"
                        value={form.shipping_actual_yen}
                        onChange={onNumberChange('shipping_actual_yen')}
                        placeholder="例：980"
                    />
                </label>


                <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-gray-600">長さ（cm）</span>
                        <input
                            className="rounded-md border px-3 py-2"
                            inputMode="decimal"
                            value={form.length_cm}
                            onChange={onNumberChange('length_cm')}
                            placeholder="例：30"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-gray-600">幅（cm）</span>
                        <input
                            className="rounded-md border px-3 py-2"
                            inputMode="decimal"
                            value={form.width_cm}
                            onChange={onNumberChange('width_cm')}
                            placeholder="例：20"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-sm text-gray-600">高さ（cm）</span>
                        <input
                            className="rounded-md border px-3 py-2"
                            inputMode="decimal"
                            value={form.height_cm}
                            onChange={onNumberChange('height_cm')}
                            placeholder="例：10"
                        />
                    </label>
                </div>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">実際の重さ (g)</span>
                    <input
                        className="rounded-md border px-3 py-2"
                        inputMode="decimal"
                        required
                        value={form.weight_g}
                        onChange={onNumberChange('weight_g')}
                        placeholder="例：350"
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">適用容量 (g)</span>
                    <input
                        className="rounded-md border px-3 py-2 bg-gray-50"
                        readOnly
                        value={form.applied_weight_g}
                        placeholder="長さ×幅×高さ÷5 で自動計算"
                    />
                </label>


                <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">配送業者（carrier）</span>
                    <input
                        className="rounded-md border px-3 py-2"
                        value={form.carrier}
                        onChange={onTextChange('carrier')}
                        placeholder="例：EMS / ePacket / FedEx"
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">Amazon サイズラベル</span>
                    <input
                        className="rounded-md border px-3 py-2"
                        value={form.amazon_size_label}
                        onChange={onTextChange('amazon_size_label')}
                        placeholder="例：SmallStandard"
                    />
                </label>
            </div>

            <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-sm text-gray-600">備考</span>
                <textarea
                    className="rounded-md border px-3 py-2"
                    rows={3}
                    value={form.remark}
                    onChange={(e) => setField('remark', e.target.value)}
                    placeholder="メモや補足を書いてください"
                />
            </label>

            <div className="flex items-center gap-3">
                <button type="submit" className="rounded-md bg-black px-4 py-2 text-white hover:opacity-90">
                    {submitLabel}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="rounded-md border px-4 py-2">
                        キャンセル
                    </button>
                )}
            </div>

            {/* メモ:
         - 数値は state では常に string。送信直前のみ数値化。
         - ?? と || を混ぜる時は必ず括弧で優先順位を明示（TS5076対策）。
      */}
        </form>
    );
}
