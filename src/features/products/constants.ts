// src/features/products/constants.ts
export const CATEGORY_LABELS: Record<string, string> = {
  'game-console': 'game&console',
  household: 'Household goods',
  toys: 'Toys & Hobbies',
  electronics: 'electronic goods & Camera',
  wristwatch: 'wristwatch',
  fishing: 'fishing gear',
  anime: 'Animation Merchandise',
  pokemon: 'Pokémon',
  fashion: 'Fashion items',
  other: 'Other',
};
// これが型（ビルド時のみ、実行時には消える）
export type CategorySlug = keyof typeof CATEGORY_LABELS;

// ついでに配列も型付きで
export const CATEGORY_SLUGS: CategorySlug[] = Object.keys(CATEGORY_LABELS) as CategorySlug[];
