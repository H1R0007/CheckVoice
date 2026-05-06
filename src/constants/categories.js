// src/constants/categories.js
// Список всех категорий товаров с их метаданными.
// Порядок категорий влияет на приоритет при автоматической категоризации.

export const CATEGORIES = [
  { key: 'fish',          name: 'Рыба и морепродукты',     cssVar: '--cat-fish',          cssVarSoft: '--cat-fish-soft' },
  { key: 'dairy',         name: 'Молочные продукты',       cssVar: '--cat-dairy',         cssVarSoft: '--cat-dairy-soft' },
  { key: 'deli',          name: 'Колбасы и деликатесы',    cssVar: '--cat-deli',          cssVarSoft: '--cat-deli-soft' },
  { key: 'meat',          name: 'Мясо и птица',            cssVar: '--cat-meat',          cssVarSoft: '--cat-meat-soft' },
  { key: 'spices',        name: 'Специи и приправы',       cssVar: '--cat-spices',        cssVarSoft: '--cat-spices-soft' },
  { key: 'bread',         name: 'Хлеб и выпечка',          cssVar: '--cat-bread',         cssVarSoft: '--cat-bread-soft' },
  { key: 'fruits',        name: 'Фрукты и ягоды',          cssVar: '--cat-fruits',        cssVarSoft: '--cat-fruits-soft' },
  { key: 'vegetables',    name: 'Овощи и зелень',          cssVar: '--cat-vegetables',    cssVarSoft: '--cat-vegetables-soft' },
  { key: 'cereals',       name: 'Крупы, макароны и мука',  cssVar: '--cat-cereals',       cssVarSoft: '--cat-cereals-soft' },
  { key: 'canned',        name: 'Консервы и соусы',        cssVar: '--cat-canned',        cssVarSoft: '--cat-canned-soft' },
  { key: 'frozen',        name: 'Замороженные продукты',   cssVar: '--cat-frozen',        cssVarSoft: '--cat-frozen-soft' },
  { key: 'drinks_nonalc', name: 'Безалкогольные напитки',  cssVar: '--cat-drinks-nonalc', cssVarSoft: '--cat-drinks-nonalc-soft' },
  { key: 'drinks_alc',    name: 'Алкоголь',                cssVar: '--cat-drinks-alc',    cssVarSoft: '--cat-drinks-alc-soft' },
  { key: 'sweets',        name: 'Сладости и снеки',        cssVar: '--cat-sweets',        cssVarSoft: '--cat-sweets-soft' },
  { key: 'baby',          name: 'Детские товары',          cssVar: '--cat-baby',          cssVarSoft: '--cat-baby-soft' },
  { key: 'pets',          name: 'Товары для животных',     cssVar: '--cat-pets',          cssVarSoft: '--cat-pets-soft' },
  { key: 'household',     name: 'Бытовая химия',           cssVar: '--cat-household',     cssVarSoft: '--cat-household-soft' },
  { key: 'hygiene',       name: 'Гигиена и уход',          cssVar: '--cat-hygiene',       cssVarSoft: '--cat-hygiene-soft' },
  { key: 'other',         name: 'Другое',                  cssVar: '--cat-other',         cssVarSoft: '--cat-other-soft' },
];

// Порядок для итерации (важен для приоритетов при категоризации)
export const CATEGORIES_ORDERED = CATEGORIES;

const OTHER_CATEGORY = CATEGORIES.find(c => c.key === 'other');

/**
 * Возвращает объект категории по ключу.
 * Всегда возвращает валидный объект (fallback на "Другое").
 */
export function getCategoryByKey(key) {
  if (!key) return OTHER_CATEGORY;
  return CATEGORIES.find(c => c.key === key) || OTHER_CATEGORY;
}

/**
 * Возвращает CSS-переменную цвета категории.
 */
export function getCategoryColor(key) {
  const cat = getCategoryByKey(key);
  return getComputedStyle(document.documentElement).getPropertyValue(cat.cssVar).trim();
}

/**
 * Возвращает CSS-переменную мягкого фона категории.
 */
export function getCategorySoftBg(key) {
  const cat = getCategoryByKey(key);
  return getComputedStyle(document.documentElement).getPropertyValue(cat.cssVarSoft).trim();
}