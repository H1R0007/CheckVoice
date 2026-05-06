// src/utils/wordsToNumber.js
// Конвертация числительных прописью в числа
// "сто сорок" → 140
// "двести пятьдесят три" → 253
// "тысяча двести" → 1200

const ONES = {
  'ноль': 0, 'нуль': 0,
  'один': 1, 'одна': 1, 'одно': 1, 'раз': 1,
  'два': 2, 'две': 2,
  'три': 3,
  'четыре': 4,
  'пять': 5, 'шесть': 6, 'семь': 7, 'восемь': 8, 'девять': 9,
  'десять': 10, 'одиннадцать': 11, 'двенадцать': 12, 'тринадцать': 13,
  'четырнадцать': 14, 'пятнадцать': 15, 'шестнадцать': 16,
  'семнадцать': 17, 'восемнадцать': 18, 'девятнадцать': 19,
};

const TENS = {
  'двадцать': 20, 'тридцать': 30, 'сорок': 40, 'пятьдесят': 50,
  'шестьдесят': 60, 'семьдесят': 70, 'восемьдесят': 80, 'девяносто': 90,
};

const HUNDREDS = {
  'сто': 100, 'двести': 200, 'триста': 300, 'четыреста': 400,
  'пятьсот': 500, 'шестьсот': 600, 'семьсот': 700, 'восемьсот': 800,
  'девятьсот': 900,
};

const MULTIPLIERS = {
  'тысяча': 1000, 'тысячи': 1000, 'тысяч': 1000, 'тыс': 1000,
};

const ALL_NUMBER_WORDS = {
  ...ONES,
  ...TENS,
  ...HUNDREDS,
  ...MULTIPLIERS,
};

/**
 * Конвертирует строку с числительными прописью в число.
 * Возвращает null если не удалось распознать.
 *
 * Примеры:
 *   "сто сорок" → 140
 *   "двести пятьдесят три" → 253
 *   "тысяча двести" → 1200
 *   "89" → 89
 */
export function wordsToNumber(text) {
  if (!text || typeof text !== 'string') return null;

  const cleaned = text.trim().toLowerCase();

  const directNum = parseFloat(cleaned.replace(',', '.'));
  if (!isNaN(directNum) && /^[\d.,]+$/.test(cleaned)) {
    return directNum;
  }

  const words = cleaned.split(/\s+/);
  let result = 0;
  let current = 0;
  let hasAny = false;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    if (HUNDREDS[w] !== undefined) {
      current += HUNDREDS[w];
      hasAny = true;
    } else if (TENS[w] !== undefined) {
      current += TENS[w];
      hasAny = true;
    } else if (ONES[w] !== undefined) {
      current += ONES[w];
      hasAny = true;
    } else if (MULTIPLIERS[w] !== undefined) {
      if (current === 0) current = 1;
      result += current * MULTIPLIERS[w];
      current = 0;
      hasAny = true;
    } else {
      return null;
    }
  }

  result += current;

  return hasAny ? result : null;
}

/**
 * Ищет первое число в строке:
 * - цифрами
 * - или последовательность числительных прописью
 *
 * Возвращает:
 * {
 *   value,
 *   startIndex,
 *   endIndex,
 *   wordIndices?
 * }
 */
export function findNumberInText(text) {
  if (!text || typeof text !== 'string') return null;

  const digitMatch = text.match(/(\d+[.,]?\d*)/);
  if (digitMatch) {
    return {
      value: parseFloat(digitMatch[1].replace(',', '.')),
      startIndex: digitMatch.index,
      endIndex: digitMatch.index + digitMatch[0].length,
    };
  }

  const words = text.toLowerCase().trim().split(/\s+/);
  let start = -1;
  let end = -1;

  for (let i = 0; i < words.length; i++) {
    if (ALL_NUMBER_WORDS[words[i]] !== undefined) {
      if (start === -1) start = i;
      end = i;
    } else if (start !== -1) {
      break;
    }
  }

  if (start === -1 || end === -1) return null;

  const numberWords = words.slice(start, end + 1).join(' ');
  const value = wordsToNumber(numberWords);

  if (value === null) return null;

  return {
    value,
    startIndex: start,
    endIndex: end + 1,
    wordIndices: { start, end },
  };
}

/**
 * Ищет последовательность числовых слов в массиве words, начиная с fromIndex.
 * Возвращает:
 * { value, start, end }
 * или null
 */
export function findNumberWordsSequence(words, fromIndex = 0) {
  if (!Array.isArray(words) || fromIndex >= words.length) return null;

  let start = -1;
  let end = -1;

  for (let i = fromIndex; i < words.length; i++) {
    const word = words[i];
    if (ALL_NUMBER_WORDS[word] !== undefined) {
      if (start === -1) start = i;
      end = i;
    } else if (start !== -1) {
      break;
    }
  }

  if (start === -1 || end === -1) return null;

  const text = words.slice(start, end + 1).join(' ');
  const value = wordsToNumber(text);

  if (value === null) return null;

  return { value, start, end };
}