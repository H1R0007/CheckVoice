import { CATEGORY_KEYWORDS } from './categoryKeywords';
import { CATEGORIES_ORDERED } from '../constants/categories';

const WEAK_KEYWORDS = new Set([
  'мяс',
  'рыб',
  'овощ',
  'овощн',
  'фрукт',
  'ягод',
  'напиток',
  'напитк',
  'детск',
  'гигиен',
  'сладост',
  'десерт',
  'питьев',
  'приправ',
  'специ',
  'пряност',
  'консерв',
  'хозяйственн',
]);

const AMBIGUOUS_SINGLE_KEYWORDS = new Set([
  'масло',
  'соль',
  'паста',
  'гель',
  'крем',
  'тоник',
  'салат',
  'соус',
  'наполнитель',
]);

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTokens(text) {
  return text ? text.split(' ').filter(Boolean) : [];
}

function containsWholeWord(paddedText, word) {
  return paddedText.includes(` ${word} `);
}

function containsPrefixToken(tokens, prefix) {
  return tokens.some(token => token.startsWith(prefix));
}

function scoreSingleKeyword(keyword, paddedText, tokens) {
  if (!keyword) return 0;

  const exactWhole = containsWholeWord(paddedText, keyword);
  const prefixMatch = keyword.length >= 4 && containsPrefixToken(tokens, keyword);

  if (!exactWhole && !prefixMatch) return 0;

  if (AMBIGUOUS_SINGLE_KEYWORDS.has(keyword)) {
    return exactWhole ? 0.5 : 0;
  }

  if (WEAK_KEYWORDS.has(keyword)) {
    return exactWhole ? 1 : 0.5;
  }

  if (keyword.length <= 3) {
    return exactWhole ? 4 : 0;
  }

  let score = 4;

  if (keyword.length >= 6) score += 1;
  if (exactWhole) score += 1;

  return score;
}

function scorePhraseKeyword(keyword, normalizedText, paddedText, tokens) {
  if (!keyword) return 0;

  const parts = keyword.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return 0;

  const allMatched = parts.every((part) => {
    if (part.length <= 3) {
      return containsWholeWord(paddedText, part);
    }

    return containsWholeWord(paddedText, part) || containsPrefixToken(tokens, part);
  });

  if (!allMatched) return 0;

  const exactPhrase = normalizedText.includes(keyword);

  let score = 6;
  if (exactPhrase) score += 2;
  if (parts.length >= 3) score += 1;

  return score;
}

function scoreKeywordMatch(rawKeyword, normalizedText, paddedText, tokens) {
  const keyword = normalizeText(rawKeyword);
  if (!keyword) return 0;

  if (keyword.includes(' ')) {
    return scorePhraseKeyword(keyword, normalizedText, paddedText, tokens);
  }

  return scoreSingleKeyword(keyword, paddedText, tokens);
}

function applyBusinessRules(normalizedText, scores, reasons) {
  const has = (phrase) => normalizedText.includes(normalizeText(phrase));

  function boost(category, value, reason) {
    scores[category] = (scores[category] || 0) + value;
    reasons.push({
      category,
      keyword: `[rule] ${reason}`,
      score: value,
    });
  }

  function penalty(category, value, reason) {
    scores[category] = (scores[category] || 0) - value;
    reasons.push({
      category,
      keyword: `[penalty] ${reason}`,
      score: -value,
    });
  }

  if (has('зубн паст')) boost('hygiene', 10, 'зубная паста');
  if (has('томатн паст') || has('том паст')) boost('canned', 10, 'томатная паста');
  if (has('соль для ванн')) boost('hygiene', 10, 'соль для ванны');
  if (has('корм для рыб')) boost('pets', 10, 'корм для рыб');
  if (has('корм для кош') || has('корм для собак')) boost('pets', 10, 'корм для животных');
  if (has('детск мыл') || has('детск шампун') || has('крем под подгузник')) boost('baby', 8, 'детский уход');
  if (has('сырок глаз')) boost('dairy', 8, 'сырок глазированный');
  if (has('морожен')) boost('frozen', 8, 'мороженое');
  if (has('батончик')) boost('sweets', 8, 'батончик');
  if (has('томатн соус') || has('соев соус') || has('чили соус')) boost('canned', 8, 'соус');
  if (has('тоник для лиц')) boost('hygiene', 10, 'тоник для лица');
  if (has('кондиционер для бель')) boost('household', 10, 'кондиционер для белья');
  if (has('кондиционер для волос')) boost('hygiene', 10, 'кондиционер для волос');
  if (has('гель для душ')) boost('hygiene', 10, 'гель для душа');
  if (has('гель для волос')) boost('hygiene', 10, 'гель для волос');
  if (has('зубн щетк')) boost('hygiene', 10, 'зубная щетка');
  if (has('печень трески')) boost('fish', 10, 'печень трески');
  if (has('икра кабачков') || has('икра баклажан')) boost('canned', 10, 'овощная икра');
  if (has('морск капуст')) boost('fish', 10, 'морская капуста');
  if (has('крабов палочк')) boost('fish', 8, 'крабовые палочки');
  if (has('зубн')) penalty('cereals', 3, 'не макароны/паста, а зубное');
  if (has('для волос')) penalty('canned', 2, 'не пищевое масло/соус');
  if (has('для лиц') || has('для рук') || has('для тел')) penalty('canned', 2, 'косметика, не пищевое');
  if (has('детск')) boost('baby', 2, 'детский контекст');
  if (has('детск')) boost('hygiene', 1, 'детский контекст');
}

function computeConfidence(bestScore, secondScore, bestCategory) {
  if (bestCategory === 'other') {
    if (bestScore >= 3) return 0.45;
    return 0.2;
  }

  if (bestScore <= 0) return 0.1;

  const gap = bestScore - secondScore;

  if (bestScore >= 12 && gap >= 6) return 0.95;
  if (bestScore >= 9 && gap >= 4) return 0.88;
  if (bestScore >= 7 && gap >= 3) return 0.8;
  if (bestScore >= 5 && gap >= 2) return 0.7;
  if (bestScore >= 3 && gap >= 1) return 0.6;
  return 0.45;
}

export function categorizeDetailed(productName) {
  if (!productName || typeof productName !== 'string') {
    return {
      category: 'other',
      confidence: 0.1,
      scores: { other: 0 },
      reasons: [],
      normalized: '',
    };
  }

  const normalizedText = normalizeText(productName);
  const paddedText = ` ${normalizedText} `;
  const tokens = getTokens(normalizedText);

  const scores = {};
  const reasons = [];

  for (const category of CATEGORIES_ORDERED) {
    scores[category.key] = 0;
  }

  for (const category of CATEGORIES_ORDERED) {
    const keywords = CATEGORY_KEYWORDS[category.key] || [];

    for (const rawKeyword of keywords) {
      const score = scoreKeywordMatch(rawKeyword, normalizedText, paddedText, tokens);

      if (score > 0) {
        scores[category.key] += score;
        reasons.push({
          category: category.key,
          keyword: rawKeyword,
          score,
        });
      }
    }
  }

  applyBusinessRules(normalizedText, scores, reasons);

  let bestCategory = 'other';
  let bestScore = -Infinity;
  let secondScore = -Infinity;

  for (const category of CATEGORIES_ORDERED) {
    const score = scores[category.key] || 0;

    if (score > bestScore) {
      secondScore = bestScore;
      bestScore = score;
      bestCategory = category.key;
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  if (bestScore < 2) {
    bestCategory = 'other';
  }

  const confidence = computeConfidence(bestScore, secondScore, bestCategory);

  return {
    category: bestCategory,
    confidence,
    scores,
    reasons: reasons
      .filter(item => item.category === bestCategory)
      .sort((a, b) => b.score - a.score),
    normalized: normalizedText,
  };
}

export function categorize(productName) {
  return categorizeDetailed(productName).category;
}