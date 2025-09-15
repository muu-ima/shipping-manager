export type Product = {
id: number;
title: { rendered: string };
meta: {
sku?: string;
price?: number;
cost?: number;
length_cm?: number;
width_cm?: number;
height_cm?: number;
weight_g?: number;
carrier?: string;
notes?: string;
shipping_actual_yen?: number; // 追加
volume_cm3?: number; // 追加
amazon_size_label?: string; // 追加
};
};