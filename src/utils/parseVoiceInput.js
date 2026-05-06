// src/utils/parseVoiceInput.js
// ПОЛНЫЙ ИСПРАВЛЕННЫЙ ФАЙЛ

import { findNumberInText, findNumberWordsSequence } from './wordsToNumber';

const TITLE_NOISE_WORDS = [
  'стоит', 'стоят', 'стоило',
  'цена', 'цену', 'цене', 'стоимость',
  'за', 'по', 'на',
  'добавь', 'добавить', 'запиши', 'записать',
  'внеси', 'внести', 'плюс',
  'пожалуйста', 'спасибо',
];

const RUBLE_WORDS = new Set([
  'рубль', 'рубля', 'рублей', 'руб',
]);

const KOPECK_WORDS = new Set([
  'копейка', 'копейки', 'копеек', 'коп',
]);

const CANCEL_WORDS = new Set([
  'отмена', 'отменить', 'отмени', 'стоп', 'stop',
  'cancel', 'назад', 'неважно', 'забудь', 'забыть',
  'ничего', 'не надо', 'не нужно',
]);

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

function stripTitleNoise(words) {
  return words.filter(
    (word) =>
      !TITLE_NOISE_WORDS.includes(word) &&
      !RUBLE_WORDS.has(word) &&
      !KOPECK_WORDS.has(word)
  );
}

function extractDecimalPrice(text) {
  const match = text.match(/(^|\s)(\d+[.,]\d{1,2})(?=\s|$)/);
  if (!match) return null;

  const raw = match[2];
  const value = parseFloat(raw.replace(',', '.'));
  if (isNaN(value) || value < 0) return null;

  return { price: roundPrice(value), rawMatch: raw };
}

/**
 * ИСПРАВЛЕНО: корректно ищет рубли и копейки по позиции в массиве слов,
 * избегая повторного использования одних и тех же индексов.
 */
function extractRublesKopecksPrice(text) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  let rubles = null;
  let kopecks = null;
  const usedIndexes = new Set();

  // --- Ищем рубли ---
  for (let i = 0; i < words.length; i++) {
    if (!RUBLE_WORDS.has(words[i])) continue;

    // Пробуем цифру перед словом "рублей"
    if (i > 0 && isNumericToken(words[i - 1]) && !usedIndexes.has(i - 1)) {
      rubles = Math.floor(parseNumericToken(words[i - 1]));
      usedIndexes.add(i - 1);
      usedIndexes.add(i);
      break;
    }

    // Пробуем числительные прописью перед словом "рублей"
    // Ищем последовательность числовых слов, заканчивающуюся на i-1
    const seq = findNumberWordsSequence(words, 0);
    if (seq && seq.end === i - 1) {
      rubles = Math.floor(seq.value);
      for (let j = seq.start; j <= seq.end; j++) usedIndexes.add(j);
      usedIndexes.add(i);
      break;
    }
  }

  // --- Ищем копейки ---
  for (let i = 0; i < words.length; i++) {
    if (!KOPECK_WORDS.has(words[i])) continue;
    if (usedIndexes.has(i)) continue;

    // Пробуем цифру перед словом "копеек"
    if (i > 0 && isNumericToken(words[i - 1]) && !usedIndexes.has(i - 1)) {
      kopecks = Math.floor(parseNumericToken(words[i - 1]));
      usedIndexes.add(i - 1);
      usedIndexes.add(i);
      break;
    }

    // Пробуем числительные прописью перед словом "копеек"
    // Ищем с позиции ПОСЛЕ последнего использованного индекса рублей
    const searchFrom = usedIndexes.size > 0
      ? Math.max(...usedIndexes) + 1
      : 0;

    const seq = findNumberWordsSequence(words, searchFrom);
    if (seq && seq.end === i - 1) {
      kopecks = Math.floor(seq.value);
      for (let j = seq.start; j <= seq.end; j++) usedIndexes.add(j);
      usedIndexes.add(i);
      break;
    }
  }

  if (rubles === null && kopecks === null) return null;

  if (rubles === null) rubles = 0;
  if (kopecks === null) kopecks = 0;
  if (kopecks > 99) kopecks = kopecks % 100;

  const price = roundPrice(rubles + kopecks / 100);
  const titleWords = words.filter((_, index) => !usedIndexes.has(index));

  return { price, titleWords };
}

export function parseVoiceInput(text) {
  if (!text || typeof text !== 'string') {
    return { title: null, price: null, error: 'nothing_parsed' };
  }

  const normalized = normalizeText(text);

  if (!normalized) {
    return { title: null, price: null, error: 'nothing_parsed' };
  }

  // 1. Рубли/копейки (структурированная цена)
  const rublesKopecks = extractRublesKopecksPrice(normalized);
  if (rublesKopecks) {
    const cleanedTitleWords = stripTitleNoise(rublesKopecks.titleWords || []);
    const title =
      cleanedTitleWords.length > 0
        ? capitalize(cleanedTitleWords.join(' '))
        : null;

    return { title, price: rublesKopecks.price };
  }

  // 2. Десятичный формат: 3465,78 / 3465.78
  const decimalPrice = extractDecimalPrice(normalized);
  if (decimalPrice) {
    const titleText = normalized
      .replace(decimalPrice.rawMatch, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const titleWords = stripTitleNoise(titleText.split(/\s+/).filter(Boolean));
    const title =
      titleWords.length > 0 ? capitalize(titleWords.join(' ')) : null;

    return { title, price: decimalPrice.price };
  }

  // 3. Одно число в строке (цифры или числительные)
  const numberResult = findNumberInText(normalized);

  if (numberResult) {
    const words = normalized.split(/\s+/);
    let titleWords;
    let price = numberResult.value;

    if (numberResult.wordIndices) {
      titleWords = [
        ...words.slice(0, numberResult.wordIndices.start),
        ...words.slice(numberResult.wordIndices.end + 1),
      ];
    } else {
      const beforeNumber = normalized.substring(0, numberResult.startIndex).trim();
      const afterNumber = normalized.substring(numberResult.endIndex).trim();
      const remainingText = (beforeNumber + ' ' + afterNumber).trim();
      titleWords = remainingText ? remainingText.split(/\s+/) : [];
    }

    titleWords = stripTitleNoise(titleWords);
    const title =
      titleWords.length > 0 ? capitalize(titleWords.join(' ')) : null;

    if (isNaN(price) || price < 0) {
      return { title, price: null };
    }

    return { title, price: roundPrice(price) };
  }

  // 4. Только название, цены нет
  const titleWords = stripTitleNoise(normalized.split(/\s+/).filter(Boolean));
  const title =
    titleWords.length > 0 ? capitalize(titleWords.join(' ')) : null;

  return { title, price: null };
}

export function extractPriceOnly(text) {
  return parseVoiceInput(text).price;
}