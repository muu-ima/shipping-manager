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
export const CATEGORY_SLUGS = Object.keys(CATEGORY_LABELS);
