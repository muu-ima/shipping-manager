'use client';
import { useEffect, useRef, useState } from 'react';

type Props = {
    initial?: Partial<{
        title: string;
        shipping_actual_yen: number | string;
        length_cm: number | string;
        width_cm: number | string;
        height_cm: number | string;
        weight_g: number | string;
        volume_cm3: number | string;
        carrier: string;
        amazon_size_label: string;
    }>;
    onSubmit: (values: any) => Promise<void> | void;
    submitLabel?: string;
};


// ---------- utils ----------
function toHalfWidthNumeric(input: string): string {
    let s = input.replace(/[０-９]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30)
    );
    s = s.replace(/．/g, '.');
    return s;
}
function sanitizeDecimal(input: string): string {
    // 少数: 数字とドットのみ / ドット1つ / 先頭. -> 0.
    let s = input.replace(/[^0-9.]/g, '');
    const firstDot = s.indexOf('.');
    if (firstDot !== -1) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
    if (s.startsWith('.')) s = '0' + s;
    return s;
}
function sanitizeInt(input: string): string {
    return input.replace(/[^0-9]/g, '');
}

const DECIMAL_FIELDS = new Set(['length_cm', 'width_cm', 'height_cm', 'weight_g']);
const INT_FIELDS = new Set(['shipping_actual_yen']); // volume_cm3 は自動計算のみ
const VOLUME_DIVISOR = 5;

// 入力中の計算用：表示はそのまま、計算だけ半角化して解釈
const parseMaybe = (s: string): number | undefined => {
    const half = toHalfWidthNumeric(s ?? '');
    if (half.trim() === '') return undefined;
    const n = Number(half);
    return Number.isFinite(n) ? n : undefined;
};

export default function ProductForm({
    initial = {},
    onSubmit,
    submitLabel = '保存',
}: Props) {
    // 文字列で保持（入力中の巻き戻り回避）
    const [v, setV] = useState({
        title: initial.title ?? '',
        shipping_actual_yen:
            initial.shipping_actual_yen != null ? String(initial.shipping_actual_yen) : '',
        length_cm: initial.length_cm != null ? String(initial.length_cm) : '',
        width_cm: initial.width_cm != null ? String(initial.width_cm) : '',
        height_cm: initial.height_cm != null ? String(initial.height_cm) : '',
        weight_g: initial.weight_g != null ? String(initial.weight_g) : '',
        volume_cm3: initial.volume_cm3 != null ? String(initial.volume_cm3) : '',
        carrier: initial.carrier ?? '',
        amazon_size_label: initial.amazon_size_label ?? '',
    });

    // ② ここから追加（トップレベルで！）
    const renderRef = useRef(0);
    const isComposingRef = useRef(false);
    const skipNextChangeRef = useRef(false);

    useEffect(() => {
        console.log('[PF] mounted');
        return () => console.log('[PF] unmounted');
    }, []);


    const calcVolume = (lRaw: string, wRaw: string, hRaw: string) => {
        const L = parseMaybe(lRaw);
        const W = parseMaybe(wRaw);
        const H = parseMaybe(hRaw);
        if (L != null && W != null && H != null) {
            return String(Math.round((L * W * H) / VOLUME_DIVISOR));
        }
        return '';
    };

    // 入力中は「絶対にサニタイズしない」—生の文字列をそのまま保存。
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.currentTarget;
        console.log('[PF] change', { name, value, composing: isComposingRef.current });

        setV(prev => {
            const updated = { ...prev, [name]: value } as typeof prev;

            // 体積は生計算（表示値は触らない）
            if (name === 'length_cm' || name === 'width_cm' || name === 'height_cm') {
                const L = name === 'length_cm' ? value : prev.length_cm;
                const W = name === 'width_cm' ? value : prev.width_cm;
                const H = name === 'height_cm' ? value : prev.height_cm;
                updated.volume_cm3 = calcVolume(L, W, H);
            }
            return updated;
        });
    };

    const handleCompositionStart = () => {
        isComposingRef.current = true;
    };
    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        isComposingRef.current = false;
        normalizeField(e.currentTarget.name, e.currentTarget.value);
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        normalizeField(e.currentTarget.name, e.currentTarget.value);
    };

    // フィールド確定時だけ正規化（半角化＋数字制限）して再セット
    const normalizeField = (name: string, rawValue: string) => {
        // 合成中は何もしない
        if (isComposingRef.current) return;

        const half = toHalfWidthNumeric(rawValue);
        let next = half;
        if (DECIMAL_FIELDS.has(name)) next = sanitizeDecimal(half);
        else if (INT_FIELDS.has(name)) next = sanitizeInt(half);

        setV(prev => {
            const updated = { ...prev, [name]: next } as typeof prev;

            if (name === 'length_cm' || name === 'width_cm' || name === 'height_cm') {
                const L = name === 'length_cm' ? next : prev.length_cm;
                const W = name === 'width_cm' ? next : prev.width_cm;
                const H = name === 'height_cm' ? next : prev.height_cm;
                updated.volume_cm3 = calcVolume(L, W, H);
            }
            return updated;
        });
    };

    // 数値入力の共通コンポーネント（入力中は生で保持）
    const NumericInput = ({
        id, name, value, placeholder,
    }: {
        id: string; name: keyof typeof v; value: string; placeholder?: string;
    }) => (
        <input
            id={id}
            name={name as string}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onBlur={handleBlur}
            autoComplete="off"
            className="border rounded px-3 py-2 w-full"
            placeholder={placeholder}
        />
    );

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const f = (s: string) => {
            const half = toHalfWidthNumeric(s);
            return half === '' ? undefined : parseFloat(sanitizeDecimal(half));
        };
        const i = (s: string) => {
            const half = toHalfWidthNumeric(s);
            return half === '' ? undefined : parseInt(sanitizeInt(half), 10);
        };

        await onSubmit({
            title: v.title,
            shipping_actual_yen: i(v.shipping_actual_yen), // 整数
            length_cm: f(v.length_cm),                     // 少数OK
            width_cm: f(v.width_cm),
            height_cm: f(v.height_cm),
            weight_g: f(v.weight_g),                       // 少数OK
            volume_cm3: i(v.volume_cm3),                   // 自動計算→整数
            carrier: v.carrier || undefined,
            amazon_size_label: v.amazon_size_label || undefined,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium">商品名</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={v.title}
                        onChange={handleChange}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        onBlur={handleBlur}
                        autoComplete="off"
                        className="border rounded px-3 py-2 w-full"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="shipping_actual_yen" className="block text-sm font-medium">実際送料(¥)</label>
                    <input
                        id="shipping_actual_yen"
                        name="shipping_actual_yen"
                        type="text"
                        inputMode="decimal"
                        value={v.shipping_actual_yen}
                        onChange={handleChange}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        onBlur={handleBlur}
                        autoComplete="off"
                        className="border rounded px-3 py-2 w-full"
                    />
                </div>

                <div>
                    <label htmlFor="length_cm" className="block text-sm font-medium">縦(cm)</label>
                    <NumericInput id="length_cm" name="length_cm" value={v.length_cm} />
                </div>

                <div>
                    <label htmlFor="width_cm" className="block text-sm font-medium">横(cm)</label>
                    <NumericInput id="width_cm" name="width_cm" value={v.width_cm} />
                </div>

                <div>
                    <label htmlFor="height_cm" className="block text-sm font-medium">高さ(cm)</label>
                    <NumericInput id="height_cm" name="height_cm" value={v.height_cm} />
                </div>

                <div>
                    <label htmlFor="weight_g" className="block text-sm font-medium">実際の重さ(g)</label>
                    <NumericInput id="weight_g" name="weight_g" value={v.weight_g} />
                </div>

                <div>
                    <label htmlFor="volume_cm3" className="block text-sm font-medium">
                        体積(cm³) = 縦×横×高さ ÷ {VOLUME_DIVISOR}
                    </label>
                    <input
                        id="volume_cm3"
                        name="volume_cm3"
                        value={v.volume_cm3}
                        readOnly
                        className="border rounded px-3 py-2 w-full bg-gray-50"
                    />
                </div>

                <div>
                    <label htmlFor="carrier" className="block text-sm font-medium">配送会社</label>
                    <input
                        id="carrier"
                        name="carrier"
                        type="text"
                        value={v.carrier}
                        onChange={handleChange}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        onBlur={handleBlur}
                        autoComplete="off"
                        className="border rounded px-3 py-2 w-full"
                        placeholder="EMS / ePacket / FedEx など"
                    />
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor="amazon_size_label" className="block text-sm font-medium">
                        Amazonでのサイズ表記
                    </label>
                    <input
                        id="amazon_size_label"
                        name="amazon_size_label"
                        type="text"
                        value={v.amazon_size_label}
                        onChange={handleChange}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        onBlur={handleBlur}
                        autoComplete="off"
                        className="border rounded px-3 py-2 w-full"
                        placeholder="例: 20 x 10 x 5 cm; 300 g"
                    />
                </div>
            </div>

            <button type="submit" className="rounded-xl bg-blue-600 text-white px-5 py-2.5">
                {submitLabel}
            </button>
        </form>
    );
}
