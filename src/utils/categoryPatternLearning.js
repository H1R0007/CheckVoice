// src/utils/categoryPatternLearning.js

const STOP_WORDS = new Set([
  'и', 'в', 'на', 'из', 'по', 'с', 'к', 'у', 'за', 'от', 'до', 'для',
  'или', 'что', 'как', 'это', 'не', 'при', 'без', 'над', 'под',
  'был', 'была', 'быть', 'есть', 'нет',
  'его', 'её', 'их', 'мой', 'мая',
]);

const GENERIC_WORDS = new Set([
  'масло',
  'продукт',
  'изделие',
  'вк',
  'класс',
  'марка',
  'вид',
  'сорт',
  'свежий',
  'новый',
  'мини',
  'упаковка',
  'пакет',
  'набор',
  'смесь',
  'порция',
  'штука',
]);

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalizeText(text)
    .split(' ')
    .filter(Boolean)
    .filter((token) => token.length >= 3)
    .filter((token) => !STOP_WORDS.has(token))
    .filter((token) => !GENERIC_WORDS.has(token));
}

function stemToken(token) {
  if (!token) return token;

  const suffixes = [
    'ями', 'ами', 'ого',
    'ому', 'ого',
    'ых', 'ой', 'ий', 'ая', 'ую',
    'ые', 'ие', 'ых', 'их',
    'ью', 'ом', 'ем',
    'ей', 'ам', 'ов',
    'ах', 'ях',
    'ых', 'их',
    'ть', 'ти',
    'а', 'я', 'е', 'о', 'у', 'ю', 'и', 'ы',
  ];

  for (const suffix of suffixes) {
    if (token.length > suffix.length + 2 && token.endsWith(suffix)) {
      return token.slice(0, -suffix.length);
    }
  }

  return token;
}

function buildNgrams(tokens, min = 2, max = 3) {
  const result = [];

  for (let size = min; size <= max; size++) {
    for (let i = 0; i <= tokens.length - size; i++) {
      result.push(tokens.slice(i, i + size));
    }
  }

  return result;
}

function buildPatternKey(tokens) {
  return tokens.map(stemToken).join(' ');
}

/**
 * Строит кандидатов на паттерны из correctionLog.
 */
export function buildPatternCandidates(correctionLog = []) {
  if (!Array.isArray(correctionLog) || correctionLog.length === 0) {
    return [];
  }

  const patternMap = new Map();

  for (const entry of correctionLog) {
    const finalCategory = entry?.finalCategory;
    const title = entry?.originalTitle;

    if (!finalCategory || !title) continue;

    const tokens = tokenize(title);
    if (tokens.length < 2) continue;

    const ngrams = buildNgrams(tokens, 2, 3);

    for (const ngram of ngrams) {
      const pattern = buildPatternKey(ngram);
      if (!pattern || pattern.length < 5) continue;

      const key = finalCategory + '::' + pattern;
      const existing = patternMap.get(key) || {
        pattern,
        category: finalCategory,
        count: 0,
        examples: [],
        titlesSet: new Set(),
      };

      existing.count += 1;

      if (!existing.titlesSet.has(title)) {
        existing.titlesSet.add(title);
        existing.examples.push(title);
      }

      patternMap.set(key, existing);
    }
  }

  const candidates = [];

  for (const value of patternMap.values()) {
    const uniqueExamplesCount = value.titlesSet.size;

    if (value.count < 2) continue;
    if (uniqueExamplesCount < 2) continue;

    candidates.push({
      pattern: value.pattern,
      category: value.category,
      count: value.count,
      examples: value.examples.slice(0, 4),
    });
  }

  candidates.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.pattern.localeCompare(b.pattern, 'ru');
  });

  return candidates.slice(0, 20);
}