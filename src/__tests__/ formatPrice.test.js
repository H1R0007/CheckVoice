// src/__tests__/formatPrice.test.js

import { formatPrice, formatPriceShort } from '../utils/formatPrice';

describe('formatPrice', () => {
  test('Целое число', () => {
    expect(formatPrice(89)).toBe('89,00 ₽');
  });

  test('С копейками', () => {
    expect(formatPrice(89.50)).toBe('89,50 ₽');
  });

  test('Тысячи с пробелом', () => {
    expect(formatPrice(1247)).toMatch(/1\s?247,00 ₽/);
  });

  test('Ноль', () => {
    expect(formatPrice(0)).toBe('0,00 ₽');
  });

  test('null', () => {
    expect(formatPrice(null)).toBe('—');
  });

  test('undefined', () => {
    expect(formatPrice(undefined)).toBe('—');
  });
});

describe('formatPriceShort', () => {
  test('Целое число — без копеек', () => {
    expect(formatPriceShort(89)).toBe('89 ₽');
  });

  test('С копейками — показывает', () => {
    expect(formatPriceShort(89.50)).toBe('89,50 ₽');
  });
});