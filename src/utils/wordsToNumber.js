// src/utils/wordsToNumber.js
// Расширенный конвертер числительных прописью в числа
// Поддерживает: "сто сорок", "полтора", "два с половиной",
// "миллион двести тысяч", "пять и три четверти" и т.д.

// ---------- Словари ----------

const ONES = {
  'ноль': 0, 'нуль': 0, 'нулю': 0, 'нуля': 0,
  'один': 1, 'одна': 1, 'одно': 1, 'одного': 1, 'одной': 1,
  'два': 2, 'две': 2, 'двух': 2, 'двум': 2, 'двумя': 2,
  'три': 3, 'трёх': 3, 'трех': 3, 'трём': 3, 'тремя': 3,
  'четыре': 4, 'четырёх': 4, 'четырех': 4, 'четырём': 4,
  'пять': 5, 'пяти': 5, 'пятью': 5,
  'шесть': 6, 'шести': 6, 'шестью': 6,
  'семь': 7, 'семи': 7, 'семью': 7,
  'восемь': 8, 'восьми': 8, 'восемью': 8,
  'девять': 9, 'девяти': 9, 'девятью': 9,
  'десять': 10, 'десяти': 10, 'десятью': 10,
  'одиннадцать': 11, 'одиннадцати': 11,
  'двенадцать': 12, 'двенадцати': 12,
  'тринадцать': 13, 'тринадцати': 13,
  'четырнадцать': 14, 'четырнадцати': 14,
  'пятнадцать': 15, 'пятнадцати': 15,
  'шестнадцать': 16, 'шестнадцати': 16,
  'семнадцать': 17, 'семнадцати': 17,
  'восемнадцать': 18, 'восемнадцати': 18,
  'девятнадцать': 19, 'девятнадцати': 19,
};

const TENS = {
  'двадцать': 20, 'двадцати': 20,
  'тридцать': 30, 'тридцати': 30,
  'сорок': 40, 'сорока': 40,
  'пятьдесят': 50, 'пятидесяти': 50,
  'шестьдесят': 60, 'шестидесяти': 60,
  'семьдесят': 70, 'семидесяти': 70,
  'восемьдесят': 80, 'восьмидесяти': 80,
  'девяносто': 90, 'девяноста': 90,
};

const HUNDREDS = {
  'сто': 100, 'ста': 100,
  'двести': 200, 'двухсот': 200, 'двумстам': 200,
  'триста': 300, 'трёхсот': 300, 'трехсот': 300,
  'четыреста': 400, 'четырёхсот': 400,
  'пятьсот': 500, 'пятисот': 500,
  'шестьсот': 600, 'шестисот': 600,
  'семьсот': 700, 'семисот': 700,
  'восемьсот': 800, 'восьмисот': 800,
  'девятьсот': 900, 'девятисот': 900,
};

const MULTIPLIERS = {
  'тысяча': 1000, 'тысячи': 1000, 'тысяч': 1000,
  'тыс': 1000, 'тысячу': 1000,
  'миллион': 1_000_000, 'миллиона': 1_000_000, 'миллионов': 1_000_000,
  'млн': 1_000_000,
  'миллиард': 1_000_000_000, 'миллиарда': 1_000_000_000, 'миллиардов': 1_000_000_000,
  'млрд': 1_000_000_000,
};

// Дробные слова — возвращают добавку к целой части
// Ключ: слово, значение: { num, den } → добавляет num/den
const FRACTION_WORDS = {
  'половина': { num: 1, den: 2 },
  'половину': { num: 1, den: 2 },
  'половиной': { num: 1, den: 2 },
  'половине': { num: 1, den: 2 },
  'треть': { num: 1, den: 3 },
  'третью': { num: 1, den: 3 },
  'трети': { num: 1, den: 3 },
  'четверть': { num: 1, den: 4 },
  'четверти': { num: 1, den: 4 },
  'четвертью': { num: 1, den: 4 },
};

// Специальные слова типа "полтора", "полторы", "полтораста"
const SPECIAL_FRACTIONS = {
  'полтора': 1.5,
  'полторы': 1.5,
  'полтораста': 150,
};

// Служебные слова-связки, которые игнорируются при разборе числа
const LINK_WORDS = new Set(['и', 'с', 'плюс']);

// Все числовые слова (для быстрой проверки)
const ALL_NUMBER_WORDS = new Set([
  ...Object.keys(ONES),
  ...Object.keys(TENS),
  ...Object.keys(HUNDREDS),
  ...Object.keys(MULTIPLIERS),
  ...Object.keys(FRACTION_WORDS),
  ...Object.keys(SPECIAL_FRACTIONS),
]);

// ---------- Вспомогательные ----------

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .trim();
}

function isNumberWord(word) {
  return ALL_NUMBER_WORDS.has(word);
}

// ---------- Основной парсер ----------

/**
 * Конвертирует массив слов (уже нормализованных) в число.
 * Поддерживает конструкции:
 *   - стандартные: "сто сорок два"
 *   - с множителями: "две тысячи триста"
 *   - с дробями: "два с половиной", "полтора"
 *   - смешанные: "двести пятьдесят три и четверть"
 * Возвращает null если не удалось разобрать.
 */
function parseNumberWords(words) {
  if (!words || words.length === 0) return null;

  // Убираем слова-связки
  const filtered = words.filter(w => !LINK_WORDS.has(w));
  if (filtered.length === 0) return null;

  // Быстрый путь: одно специальное дробное слово
  if (filtered.length === 1 && SPECIAL_FRACTIONS[filtered[0]] !== undefined) {
    return SPECIAL_FRACTIONS[filtered[0]];
  }

  let result = 0;
  let current = 0;
  let fraction = 0;
  let hasAny = false;

  for (let i = 0; i < filtered.length; i++) {
    const w = filtered[i];

    // Специальная дробь как отдельное слово (полтора тысячи = 1500)
    if (SPECIAL_FRACTIONS[w] !== undefined) {
      const val = SPECIAL_FRACTIONS[w];
      hasAny = true;
      // Если следующее слово — множитель
      if (i + 1 < filtered.length && MULTIPLIERS[filtered[i + 1]] !== undefined) {
        const mult = MULTIPLIERS[filtered[i + 1]];
        result += val * mult;
        i++;
      } else {
        current += val;
      }
      continue;
    }

    // Дробная часть ("половина", "треть", "четверть")
    if (FRACTION_WORDS[w] !== undefined) {
      const { num, den } = FRACTION_WORDS[w];
      fraction += num / den;
      hasAny = true;
      continue;
    }

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
      const mult = MULTIPLIERS[w];
      if (current === 0 && result === 0) current = 1;
      // Для больших множителей сбрасываем накопленное в result
      if (mult >= 1000) {
        result += current * mult;
        current = 0;
      } else {
        current *= mult;
      }
      hasAny = true;
    } else {
      // Нечисловое слово — прерываем
      return null;
    }
  }

  if (!hasAny) return null;

  result += current + fraction;
  return result;
}

// ---------- Публичные функции ----------

/**
 * Конвертирует строку с числительными прописью в число.
 * "сто сорок" → 140
 * "два с половиной" → 2.5
 * "полтора" → 1.5
 * "миллион двести тысяч" → 1_200_000
 * "89" → 89
 */
export function wordsToNumber(text) {
  if (!text || typeof text !== 'string') return null;

  const cleaned = normalize(text);

  // Прямое число
  const directNum = parseFloat(cleaned.replace(',', '.'));
  if (!isNaN(directNum) && /^[\d.,]+$/.test(cleaned)) {
    return directNum;
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  return parseNumberWords(words);
}

/**
 * Ищет первое число в строке (цифры или числительные прописью).
 * Возвращает { value, startIndex, endIndex, wordIndices? } или null.
 */
export function findNumberInText(text) {
  if (!text || typeof text !== 'string') return null;

  // Сначала ищем цифры (включая дроби "5.5", "3,50")
  const digitMatch = text.match(/(\d+[.,]?\d*)/);
  if (digitMatch) {
    return {
      value: parseFloat(digitMatch[1].replace(',', '.')),
      startIndex: digitMatch.index,
      endIndex: digitMatch.index + digitMatch[0].length,
    };
  }

  // Ищем числительные прописью
  const words = normalize(text).split(/\s+/);
  let start = -1;
  let end = -1;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const isNum = isNumberWord(w) || LINK_WORDS.has(w);
    if (isNum) {
      if (start === -1) start = i;
      end = i;
    } else if (start !== -1) {
      break;
    }
  }

  if (start === -1) return null;

  // Убираем хвостовые связки
  while (end > start && LINK_WORDS.has(words[end])) end--;

  const numberWords = words.slice(start, end + 1);
  const value = parseNumberWords(numberWords);

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
 * Возвращает { value, start, end } или null.
 */
export function findNumberWordsSequence(words, fromIndex = 0) {
  if (!Array.isArray(words) || fromIndex >= words.length) return null;

  let start = -1;
  let end = -1;

  for (let i = fromIndex; i < words.length; i++) {
    const w = normalize(words[i]);
    const isNum = isNumberWord(w) || LINK_WORDS.has(w);
    if (isNum) {
      if (start === -1) start = i;
      end = i;
    } else if (start !== -1) {
      break;
    }
  }

  if (start === -1) return null;

  while (end > start && LINK_WORDS.has(normalize(words[end]))) end--;

  const slice = words.slice(start, end + 1).map(normalize);
  const value = parseNumberWords(slice);

  if (value === null) return null;

  return { value, start, end };
}

/**
 * Проверяет, является ли слово числовым (для фильтрации из названия товара).
 */
export function isNumberRelatedWord(word) {
  const w = normalize(word);
  return isNumberWord(w) || LINK_WORDS.has(w);
}