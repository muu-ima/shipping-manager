export interface WPTitle { rendered?: string }

export interface ProductMeta {
  cost?: number | string | null;
  length_cm?: number | string | null;
  width_cm?: number | string | null;
  height_cm?: number | string | null;
  weight_g?: number | string | null;
  applied_weight_g?: number;
  shipping_actual_yen?: number | string | null;
  carrier?: string | null;
  amazon_size_label?: string | null;
}

export interface WPProduct {
  id: number;
  title?: WPTitle;
  meta?: ProductMeta;
}
