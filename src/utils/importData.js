// src/utils/importData.js

import { STORAGE_VERSION } from '../constants/storage';
import { getEmptyCategoryLearning } from './categoryLearning';

export function importFromJSON(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ success: false, error: 'no_file', message: 'Файл не выбран' });
      return;
    }

    if (!file.name.endsWith('.json')) {
      resolve({ success: false, error: 'wrong_format', message: 'Файл должен быть в формате JSON' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      resolve({ success: false, error: 'too_large', message: 'Файл слишком большой (максимум 10 МБ)' });
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const json = event.target.result;
        const data = JSON.parse(json);

        const validation = validateImportData(data);
        if (!validation.valid) {
          resolve({
            success: false,
            error: 'invalid_data',
            message: validation.message
          });
          return;
        }

        const state = convertImportToState(data);

        resolve({
          success: true,
          state,
          stats: {
            receiptsImported: state.savedReceipts.length,
            itemsImported: state.savedReceipts.reduce((sum, r) => sum + r.items.length, 0),
            totalSpent: state.savedReceipts.reduce((sum, r) => sum + r.total, 0),
          }
        });

      } catch (error) {
        console.error('import: parse error:', error);
        resolve({
          success: false,
          error: 'parse_error',
          message: 'Не удалось прочитать файл: ' + error.message
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        error: 'read_error',
        message: 'Ошибка чтения файла'
      });
    };

    reader.readAsText(file, 'UTF-8');
  });
}

function validateImportData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, message: 'Файл не содержит данных' };
  }

  if (data.appName && data.appName !== 'ЧекВойс') {
    return { valid: false, message: 'Файл создан другим приложением' };
  }

  if (!data.receipts && !data.savedReceipts) {
    return { valid: false, message: 'Файл не содержит чеков' };
  }

  const receipts = data.receipts || data.savedReceipts;

  if (!Array.isArray(receipts)) {
    return { valid: false, message: 'Некорректный формат чеков' };
  }

  for (let i = 0; i < receipts.length; i++) {
    const receipt = receipts[i];

    if (!receipt.items || !Array.isArray(receipt.items)) {
      return { valid: false, message: `Чек #${i + 1}: отсутствуют товары` };
    }

    for (let j = 0; j < receipt.items.length; j++) {
      const item = receipt.items[j];

      if (!item.title || typeof item.title !== 'string') {
        return { valid: false, message: `Чек #${i + 1}, товар #${j + 1}: отсутствует название` };
      }

      if (item.price === undefined || item.price === null || typeof item.price !== 'number') {
        return { valid: false, message: `Чек #${i + 1}, товар #${j + 1}: некорректная цена` };
      }

      if (item.price < 0) {
        return { valid: false, message: `Чек #${i + 1}, товар #${j + 1}: отрицательная цена` };
      }
    }
  }

  return { valid: true };
}

function normalizeCategoryLearning(raw) {
  const empty = getEmptyCategoryLearning();
  if (!raw || typeof raw !== 'object') return empty;

  return {
    exactOverrides: raw.exactOverrides || {},
    approvedPatterns: Array.isArray(raw.approvedPatterns) ? raw.approvedPatterns : [],
    correctionLog: Array.isArray(raw.correctionLog) ? raw.correctionLog : [],
    stats: {
      totalCorrections: raw.stats?.totalCorrections || 0,
      totalApprovedPatterns:
        raw.stats?.totalApprovedPatterns ||
        (Array.isArray(raw.approvedPatterns) ? raw.approvedPatterns.length : 0),
    },
  };
}

function convertImportToState(data) {
  const receipts = data.receipts || data.savedReceipts || [];

  const processedReceipts = receipts.map(receipt => ({
    id: receipt.id || generateImportId(),
    date: receipt.date || new Date(receipt.createdAt || Date.now()).toISOString().split('T')[0],
    createdAt: receipt.createdAt || new Date().toISOString(),
    items: receipt.items.map(item => ({
      id: item.id || generateImportId(),
      title: item.title,
      price: item.price,
      category: item.category || 'other',
      autoCategory: item.autoCategory || item.category || 'other',
      categorySource: item.categorySource || 'auto',
      categoryConfidence:
        typeof item.categoryConfidence === 'number' ? item.categoryConfidence : 0.5,
      createdAt: item.createdAt || new Date().toISOString()
    })),
    total: receipt.total || receipt.items.reduce((sum, item) => sum + item.price, 0)
  }));

  processedReceipts.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return {
    version: STORAGE_VERSION,
    currentReceipt: data.currentReceipt || { items: [] },
    savedReceipts: processedReceipts,
    lastExportedAt: null,
    categoryLearning: normalizeCategoryLearning(data.categoryLearning),
  };
}

function generateImportId() {
  return 'imp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function mergeCategoryLearning(existingLearning, importedLearning) {
  const safeExisting = normalizeCategoryLearning(existingLearning);
  const safeImported = normalizeCategoryLearning(importedLearning);

  const mergedApprovedPatternsMap = new Map();

  [...safeExisting.approvedPatterns, ...safeImported.approvedPatterns].forEach((pattern) => {
    const key = (pattern.category || '') + '::' + (pattern.pattern || '');
    if (!mergedApprovedPatternsMap.has(key)) {
      mergedApprovedPatternsMap.set(key, pattern);
    }
  });

  return {
    exactOverrides: {
      ...safeExisting.exactOverrides,
      ...safeImported.exactOverrides,
    },
    approvedPatterns: Array.from(mergedApprovedPatternsMap.values()).slice(0, 200),
    correctionLog: [
      ...(safeImported.correctionLog || []),
      ...(safeExisting.correctionLog || []),
    ].slice(0, 500),
    stats: {
      totalCorrections:
        (safeExisting.stats?.totalCorrections || 0) +
        (safeImported.stats?.totalCorrections || 0),
      totalApprovedPatterns: mergedApprovedPatternsMap.size,
    },
  };
}

export function mergeImportedState(existingState, importedState, mode) {
  if (mode === 'replace') {
    return importedState;
  }

  const existingIds = new Set(existingState.savedReceipts.map(r => r.id));
  const newReceipts = importedState.savedReceipts.filter(r => !existingIds.has(r.id));

  const merged = {
    ...existingState,
    savedReceipts: [...newReceipts, ...existingState.savedReceipts],
    categoryLearning: mergeCategoryLearning(
      existingState.categoryLearning,
      importedState.categoryLearning
    ),
  };

  merged.savedReceipts.sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return merged;
}