// src/utils/parseVoiceInput.js

import { findNumberInText, findNumberWordsSequence, isNumberRelatedWord } from './wordsToNumber';

// ========== ТЕСТЫ ПАРСИНГА ==========
/*
ПРИМЕРЫ КОРРЕКТНОГО ПАРСИНГА:

1. "Молоко 89 рублей" → { title: "Молоко", price: 89 }
2. "Хлеб 45" → { title: "Хлеб", price: 45 }
3. "89,50 молоко" → { title: "Молоко", price: 89.5 }
4. "Сто двадцать пять рублей хлеб" → { title: "Хлеб", price: 125 }
5. "Молоко два с половиной" → { title: "Молоко", price: 2.5 }
6. "Пять с половиной голубцы" → { title: "Голубцы", price: 5.5 }
7. "89 рублей 50 копеек молоко" → { title: "Молоко", price: 89.5 }
8. "Хлеб" → { title: "Хлеб", price: null }
9. "100" → { title: null, price: 100 }
10. "Два рубля пятьдесят копеек" → { title: null, price: 2.5 }

ДРОБИ:
- "Два с половиной" → 2.5
- "Пять с четвертью" → 5.25
- "Три с половиной рубля" → 3.5
- "Полтора" → 1.5

КОПЕЙКИ:
- "89 рублей 50 копеек" → 89.5
- "Сто рублей тридцать копеек" → 100.3
*/

// ---------- Константы ----------

const TITLE_NOISE_WORDS = new Set([
  'стоит', 'стоят', 'стоило', 'цена', 'цену', 'цене', 'стоимость',
  'за', 'по', 'на', 'в',
  'добавь', 'добавить', 'запиши', 'записать',
  'внеси', 'внести', 'плюс',
  'пожалуйста', 'спасибо',
]);

const RUBLE_WORDS = new Set([
  'рубль', 'рубля', 'рублей', 'руб', 'р',
]);

const KOPECK_WORDS = new Set([
  'копейка', 'копейки', 'копеек', 'коп',
]);

const CANCEL_WORDS = new Set([
  'отмена', 'отменить', 'отмени', 'стоп', 'stop',
  'cancel', 'назад', 'неважно', 'забудь', 'забыть',
  'ничего', 'не надо', 'не нужно',
]);

// Слова-связки которые могут быть частью числа и НЕ должны попадать в название
const FRACTION_LINK_WORDS = new Set(['с', 'и']);

// ---------- Утилиты ----------

export function isCancelPhrase(text) {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  if (CANCEL_WORDS.has(lower)) return true;
  for (const word of CANCEL_WORDS) {
    if (lower.includes(word)) return true;
  }
  return false;
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}.,]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNumericToken(token) {
  return /^\d+[.,]?\d*$/.test(token);
}

function parseNumericToken(token) {
  if (!token) return null;
  const value = parseFloat(token.replace(',', '.'));
  return isNaN(value) ? null : value;
}

function roundPrice(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Очищает слова от шума: служебные слова, рубли, копейки,
 * числовые слова и цифры.
 */
function stripPriceWordsFromTitle(words) {
  return words.filter(w => {
    if (!w) return false;
    if (TITLE_NOISE_WORDS.has(w)) return false;
    if (RUBLE_WORDS.has(w)) return false;
    if (KOPECK_WORDS.has(w)) return false;
    if (isNumericToken(w)) return false;
    if (isNumberRelatedWord(w)) return false;
    return true;
  });
}

// ---------- Стратегии парсинга ----------

/**
 * Стратегия 1: Дробный формат с точкой/запятой (3465.78 / 89,50)
 */
function tryDecimalPrice(words) {
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (/^\d+[.,]\d{1,2}$/.test(w)) {
      const price = parseFloat(w.replace(',', '.'));
      if (isNaN(price) || price < 0) continue;
      const titleWords = [...words.slice(0, i), ...words.slice(i + 1)];
      return { price: roundPrice(price), titleWords, strategy: 'decimal' };
    }
  }
  return null;
}

/**
 * Стратегия 2: Явные рубли и/или копейки прописью или цифрами.
 * "сто сорок пять рублей пятьдесят копеек"
 * "89 рублей 50 копеек"
 * "два с половиной рубля"
 */
function tryRublesKopecks(words) {
  const usedIndexes = new Set();
  let rubles = null;
  let kopecks = null;

  // --- Ищем рубли ---
  for (let i = 0; i < words.length; i++) {
    if (!RUBLE_WORDS.has(words[i])) continue;

    // Цифра перед "рублей"
    if (i > 0 && isNumericToken(words[i - 1]) && !usedIndexes.has(i - 1)) {
      rubles = Math.floor(parseNumericToken(words[i - 1]));
      usedIndexes.add(i - 1);
      usedIndexes.add(i);
      break;
    }

    // Числительные прописью (включая "два с половиной")
    const searchFrom = 0;
    const seq = findNumberWordsSequence(words, searchFrom);
    if (seq && seq.end <= i - 1) {
      rubles = seq.value; // может быть дробным (2.5)
      for (let j = seq.start; j <= seq.end; j++) usedIndexes.add(j);
      usedIndexes.add(i);
      break;
    }
  }

  // --- Ищем копейки ---
  for (let i = 0; i < words.length; i++) {
    if (!KOPECK_WORDS.has(words[i])) continue;
    if (usedIndexes.has(i)) continue;

    // Цифра перед "копеек"
    if (i > 0 && isNumericToken(words[i - 1]) && !usedIndexes.has(i - 1)) {
      kopecks = Math.floor(parseNumericToken(words[i - 1]));
      usedIndexes.add(i - 1);
      usedIndexes.add(i);
      break;
    }

    const searchFrom = usedIndexes.size > 0 ? Math.max(...usedIndexes) + 1 : 0;
    const seq = findNumberWordsSequence(words, searchFrom);
    if (seq && seq.end === i - 1) {
      kopecks = Math.floor(seq.value);
      for (let j = seq.start; j <= seq.end; j++) usedIndexes.add(j);
      usedIndexes.add(i);
      break;
    }
  }

  if (rubles === null && kopecks === null) return null;

  const r = rubles !== null ? Math.floor(rubles) : 0;
  const fractR = rubles !== null ? rubles - Math.floor(rubles) : 0;
  const k = kopecks !== null ? Math.max(0, Math.min(99, kopecks)) : 0;

  const price = roundPrice(r + fractR + k / 100);
  const titleWords = words.filter((_, idx) => !usedIndexes.has(idx));

  return { price, titleWords, strategy: 'rubles_kopecks' };
}

/**
 * Стратегия 3: Число в конце строки.
 */
function tryNumberAtEnd(words) {
  if (words.length === 0) return null;

  for (let endIdx = words.length - 1; endIdx >= 0; endIdx--) {
    if (isNumericToken(words[endIdx])) {
      const price = parseNumericToken(words[endIdx]);
      if (price === null || price < 0) continue;
      const titleWords = words.slice(0, endIdx);
      return { price: roundPrice(price), titleWords, strategy: 'digit_at_end' };
    }
    if (!FRACTION_LINK_WORDS.has(words[endIdx]) && !isNumberRelatedWord(words[endIdx])) {
      break;
    }
  }

  let numEnd = -1;
  let numStart = -1;

  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    if (isNumberRelatedWord(w) || FRACTION_LINK_WORDS.has(w)) {
      if (numEnd === -1) numEnd = i;
      numStart = i;
    } else {
      break;
    }
  }

  if (numStart === -1 || numEnd === -1) return null;

  let actualEnd = numEnd;
  while (actualEnd > numStart && FRACTION_LINK_WORDS.has(words[actualEnd])) {
    actualEnd--;
  }

  const seq = findNumberWordsSequence(words, numStart);

  if (!seq || seq.value === null || seq.value < 0) return null;

  if (seq.end < actualEnd) return null;

  const titleWords = words.slice(0, numStart);

  while (titleWords.length > 0 && FRACTION_LINK_WORDS.has(titleWords[titleWords.length - 1])) {
    titleWords.pop();
  }

  return {
    price: roundPrice(seq.value),
    titleWords,
    strategy: 'words_at_end',
  };
}

/**
 * Стратегия 4: Число в начале строки.
 */
function tryNumberAtStart(words) {
  if (words.length === 0) return null;

  if (isNumericToken(words[0])) {
    const price = parseNumericToken(words[0]);
    if (price !== null && price >= 0) {
      return { price: roundPrice(price), titleWords: words.slice(1), strategy: 'digit_at_start' };
    }
  }

  const seq = findNumberWordsSequence(words, 0);
  if (seq && seq.start === 0) {
    return {
      price: roundPrice(seq.value),
      titleWords: words.slice(seq.end + 1),
      strategy: 'words_at_start',
    };
  }

  return null;
}

/**
 * Стратегия 5: Единственное число где-то в середине.
 */
function tryNumberAnywhere(words) {
  const result = findNumberInText(words.join(' '));
  if (!result) return null;

  let titleWords;
  if (result.wordIndices) {
    titleWords = [
      ...words.slice(0, result.wordIndices.start),
      ...words.slice(result.wordIndices.end + 1),
    ];
  } else {
    const joined = words.join(' ');
    const before = joined.substring(0, result.startIndex).trim();
    const after = joined.substring(result.endIndex).trim();
    const combined = (before + ' ' + after).trim();
    titleWords = combined ? combined.split(/\s+/) : [];
  }

  return {
    price: roundPrice(result.value),
    titleWords,
    strategy: 'anywhere',
  };
}

// ---------- Основная функция ----------

export function parseVoiceInput(text) {
  if (!text || typeof text !== 'string') {
    return { title: null, price: null, error: 'nothing_parsed' };
  }

  const normalized = normalizeText(text);
  if (!normalized) {
    return { title: null, price: null, error: 'nothing_parsed' };
  }

  const words = normalized.split(/\s+/).filter(Boolean);

  const strategies = [
    () => tryRublesKopecks(words),
    () => tryDecimalPrice(words),
    () => tryNumberAtEnd(words),
    () => tryNumberAtStart(words),
    () => tryNumberAnywhere(words),
  ];

  for (const strategy of strategies) {
    const result = strategy();
    if (!result) continue;

    const { price, titleWords } = result;

    if (price === null || price < 0 || isNaN(price)) continue;

    const cleanedTitleWords = stripPriceWordsFromTitle(titleWords || []);
    const title = cleanedTitleWords.length > 0
      ? capitalize(cleanedTitleWords.join(' '))
      : null;

    return { title, price };
  }

  const cleanedTitleWords = stripPriceWordsFromTitle(words);
  const title = cleanedTitleWords.length > 0
    ? capitalize(cleanedTitleWords.join(' '))
    : null;

  return { title, price: null };
}

export function extractPriceOnly(text) {
  return parseVoiceInput(text).price;
}