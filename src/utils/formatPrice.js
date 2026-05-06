// src/utils/formatPrice.js

/**
 * Форматирует цену для отображения
 * 89.5 → "89.50 ₽"
 * 1247 → "1 247.00 ₽"
 * 0 → "0.00 ₽"
 * null → "—"
 */
export function formatPrice(price) {
  if (price === null || price === undefined) {
    return '—';
  }
  
  const formatted = price.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${formatted} ₽`;
}

/**
 * Форматирует цену коротко (без копеек, если .00)
 * 89.00 → "89 ₽"
 * 89.50 → "89.50 ₽"
 * 1247.00 → "1 247 ₽"
 */
export function formatPriceShort(price) {
  if (price === null || price === undefined) {
    return '—';
  }
  
  const hasKopecks = price % 1 !== 0;
  
  const formatted = price.toLocaleString('ru-RU', {
    minimumFractionDigits: hasKopecks ? 2 : 0,
    maximumFractionDigits: hasKopecks ? 2 : 0,
  });
  
  return `${formatted} ₽`;
}