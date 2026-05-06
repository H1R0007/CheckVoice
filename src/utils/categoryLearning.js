// src/utils/categoryLearning.js

import { categorizeDetailed } from './categorize';

export function normalizeCategoryTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getEmptyCategoryLearning() {
  return {
    exactOverrides: {},
    approvedPatterns: [],
    correctionLog: [],
    stats: {
      totalCorrections: 0,
      totalApprovedPatterns: 0,
    },
  };
}

function patternMatchesTitle(pattern, normalizedTitle) {
  if (!pattern || !normalizedTitle) return false;

  const patternParts = normalizeCategoryTitle(pattern)
    .split(' ')
    .filter(Boolean);
  const titleTokens = normalizeCategoryTitle(normalizedTitle)
    .split(' ')
    .filter(Boolean);

  if (patternParts.length === 0 || titleTokens.length === 0) return false;

  return patternParts.every((part) =>
    titleTokens.some((token) => token.startsWith(part) || token === part)
  );
}

function resolveFromApprovedPatterns(title, approvedPatterns) {
  const normalizedTitle = normalizeCategoryTitle(title);
  const patterns = Array.isArray(approvedPatterns) ? approvedPatterns : [];

  const matched = patterns
    .filter((entry) => patternMatchesTitle(entry.pattern, normalizedTitle))
    .sort((a, b) => {
      if ((b.weight || 0) !== (a.weight || 0)) {
        return (b.weight || 0) - (a.weight || 0);
      }
      return (b.pattern?.length || 0) - (a.pattern?.length || 0);
    });

  if (matched.length === 0) return null;
  return matched[0];
}

export function resolveItemCategory(title, categoryLearning) {
  const normalizedTitle = normalizeCategoryTitle(title);
  const exactOverride = categoryLearning?.exactOverrides?.[normalizedTitle];
  const predicted = categorizeDetailed(title);

  if (exactOverride?.category) {
    return {
      category: exactOverride.category,
      autoCategory: predicted.category || exactOverride.category,
      categorySource: 'learned-exact',
      categoryConfidence: 1,
    };
  }

  const approvedPattern = resolveFromApprovedPatterns(
    title,
    categoryLearning?.approvedPatterns
  );

  if (approvedPattern?.category) {
    return {
      category: approvedPattern.category,
      autoCategory: predicted.category || approvedPattern.category,
      categorySource: 'learned-pattern',
      categoryConfidence: 0.92,
    };
  }

  return {
    category: predicted.category || 'other',
    autoCategory: predicted.category || 'other',
    categorySource: 'auto',
    categoryConfidence:
      typeof predicted.confidence === 'number' ? predicted.confidence : 0.5,
  };
}

export function createCategoryCorrectionRecord(item, newCategory) {
  return {
    id:
      'corr_' +
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 9),
    normalizedTitle: normalizeCategoryTitle(item?.title || ''),
    originalTitle: item?.title || '',
    autoCategory: item?.autoCategory || item?.category || 'other',
    finalCategory: newCategory,
    timestamp: new Date().toISOString(),
  };
}

export function applyCategoryCorrectionToLearning(
  categoryLearning,
  item,
  newCategory
) {
  const safeLearning = categoryLearning || getEmptyCategoryLearning();
  const normalizedTitle = normalizeCategoryTitle(item?.title || '');

  if (!normalizedTitle) return safeLearning;

  const previousOverride = safeLearning.exactOverrides[normalizedTitle];
  const correctionRecord = createCategoryCorrectionRecord(item, newCategory);

  return {
    ...safeLearning,
    exactOverrides: {
      ...safeLearning.exactOverrides,
      [normalizedTitle]: {
        category: newCategory,
        count: (previousOverride?.count || 0) + 1,
        updatedAt: correctionRecord.timestamp,
        source: 'user',
      },
    },
    correctionLog: [
      correctionRecord,
      ...(safeLearning.correctionLog || []),
    ].slice(0, 500),
    stats: {
      totalCorrections: (safeLearning.stats?.totalCorrections || 0) + 1,
      totalApprovedPatterns:
        safeLearning.stats?.totalApprovedPatterns || 0,
    },
  };
}

export function approvePatternCandidate(categoryLearning, candidate) {
  const safeLearning = categoryLearning || getEmptyCategoryLearning();
  if (!candidate?.pattern || !candidate?.category) return safeLearning;

  const normalizedPattern = normalizeCategoryTitle(candidate.pattern);
  const existingPatterns = Array.isArray(safeLearning.approvedPatterns)
    ? safeLearning.approvedPatterns
    : [];

  const alreadyExists = existingPatterns.some(
    (entry) =>
      normalizeCategoryTitle(entry.pattern) === normalizedPattern &&
      entry.category === candidate.category
  );

  if (alreadyExists) return safeLearning;

  const approvedEntry = {
    id:
      'pat_' +
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 9),
    pattern: normalizedPattern,
    category: candidate.category,
    weight: candidate.count || 1,
    approvedAt: new Date().toISOString(),
    examples: Array.isArray(candidate.examples)
      ? candidate.examples.slice(0, 5)
      : [],
    source: 'developer-approved',
  };

  return {
    ...safeLearning,
    approvedPatterns: [approvedEntry, ...existingPatterns].slice(0, 200),
    stats: {
      totalCorrections: safeLearning.stats?.totalCorrections || 0,
      totalApprovedPatterns:
        (safeLearning.stats?.totalApprovedPatterns || 0) + 1,
    },
  };
}

export function removeApprovedPattern(categoryLearning, patternId) {
  const safeLearning = categoryLearning || getEmptyCategoryLearning();
  const existingPatterns = Array.isArray(safeLearning.approvedPatterns)
    ? safeLearning.approvedPatterns
    : [];

  const nextPatterns = existingPatterns.filter(
    (entry) => entry.id !== patternId
  );

  return {
    ...safeLearning,
    approvedPatterns: nextPatterns,
    stats: {
      totalCorrections: safeLearning.stats?.totalCorrections || 0,
      totalApprovedPatterns: nextPatterns.length,
    },
  };
}