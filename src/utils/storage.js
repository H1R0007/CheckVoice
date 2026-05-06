// src/utils/storage.js

import {
  STORAGE_KEY,
  STORAGE_VERSION,
  STORAGE_WARNING_PERCENT,
  STORAGE_CRITICAL_PERCENT,
  STORAGE_MAX_BYTES
} from '../constants/storage';
import { getEmptyCategoryLearning } from './categoryLearning';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

export function getCurrentTimestamp() {
  return new Date().toISOString();
}

function getEmptyState() {
  return {
    version: STORAGE_VERSION,
    currentReceipt: {
      items: []
    },
    savedReceipts: [],
    lastExportedAt: null,
    categoryLearning: getEmptyCategoryLearning(),
  };
}

function normalizeItem(item) {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.id !== 'string') return null;
  if (typeof item.title !== 'string') return null;
  if (typeof item.price !== 'number' || isNaN(item.price) || item.price < 0) return null;

  const category = typeof item.category === 'string' ? item.category : 'other';
  const autoCategory = typeof item.autoCategory === 'string' ? item.autoCategory : category;
  const categorySource = typeof item.categorySource === 'string' ? item.categorySource : 'auto';
  const categoryConfidence =
    typeof item.categoryConfidence === 'number' && !isNaN(item.categoryConfidence)
      ? item.categoryConfidence
      : 0.5;

  return {
    ...item,
    category,
    autoCategory,
    categorySource,
    categoryConfidence,
    createdAt: item.createdAt || getCurrentTimestamp(),
  };
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

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      console.log('storage: no data found, returning empty state');
      return getEmptyState();
    }

    const parsed = JSON.parse(raw);

    if (!parsed.version || parsed.version !== STORAGE_VERSION) {
      console.warn('storage: version mismatch, migrating...');
      return migrateState(parsed);
    }

    if (!validateState(parsed)) {
      console.error('storage: invalid state structure, returning empty');
      return getEmptyState();
    }

    return parsed;

  } catch (error) {
    console.error('storage: failed to load state:', error);
    return getEmptyState();
  }
}

export function saveState(state) {
  try {
    const storageInfo = getStorageInfo();
    if (storageInfo.percent >= STORAGE_CRITICAL_PERCENT) {
      return {
        success: false,
        error: 'storage_critical',
        message: `Хранилище заполнено на ${storageInfo.percent}%. Экспортируйте данные для продолжения.`
      };
    }

    const json = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, json);

    const newInfo = getStorageInfo();
    if (newInfo.percent >= STORAGE_WARNING_PERCENT) {
      return {
        success: true,
        warning: 'storage_warning',
        message: `Хранилище заполнено на ${newInfo.percent}%. Рекомендуем экспортировать данные.`
      };
    }

    return { success: true };

  } catch (error) {
    console.error('storage: failed to save state:', error);

    if (error.name === 'QuotaExceededError' || error.code === 22) {
      return {
        success: false,
        error: 'storage_full',
        message: 'Хранилище переполнено. Экспортируйте данные и очистите старые чеки.'
      };
    }

    return {
      success: false,
      error: 'unknown',
      message: 'Не удалось сохранить данные: ' + error.message
    };
  }
}

function validateState(state) {
  if (!state || typeof state !== 'object') return false;
  if (!state.currentReceipt || typeof state.currentReceipt !== 'object') return false;
  if (!Array.isArray(state.currentReceipt.items)) return false;
  if (!Array.isArray(state.savedReceipts)) return false;

  state.currentReceipt.items = state.currentReceipt.items
    .map(normalizeItem)
    .filter(Boolean);

  state.savedReceipts = state.savedReceipts.filter(function(receipt) {
    if (!receipt || typeof receipt !== 'object') return false;
    if (!receipt.id || !receipt.date) return false;
    if (!Array.isArray(receipt.items)) return false;
    if (typeof receipt.total !== 'number' || isNaN(receipt.total)) return false;

    receipt.items = receipt.items
      .map(function(item) {
        const normalized = normalizeItem({
          ...item,
          id: typeof item?.id === 'string' ? item.id : generateId(),
        });
        return normalized;
      })
      .filter(Boolean);

    receipt.total = receipt.items.reduce(function(sum, item) {
      return sum + item.price;
    }, 0);
    receipt.total = Math.round(receipt.total * 100) / 100;

    return receipt.items.length > 0;
  });

  state.categoryLearning = normalizeCategoryLearning(state.categoryLearning);

  return true;
}

function migrateState(oldState) {
  console.log('storage: migrating from version', oldState.version, 'to', STORAGE_VERSION);

  const newState = getEmptyState();

  if (oldState.savedReceipts && Array.isArray(oldState.savedReceipts)) {
    newState.savedReceipts = oldState.savedReceipts;
  }

  if (oldState.currentReceipt && oldState.currentReceipt.items) {
    newState.currentReceipt = oldState.currentReceipt;
  }

  if (oldState.lastExportedAt) {
    newState.lastExportedAt = oldState.lastExportedAt;
  }

  newState.categoryLearning = normalizeCategoryLearning(oldState.categoryLearning);

  newState.version = STORAGE_VERSION;
  validateState(newState);
  return newState;
}

export function getStorageInfo() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    const usedBytes = new Blob([raw]).size;
    const percent = Math.round((usedBytes / STORAGE_MAX_BYTES) * 100);
    const receiptsCount = (() => {
      try {
        const parsed = JSON.parse(raw);
        return parsed.savedReceipts ? parsed.savedReceipts.length : 0;
      } catch {
        return 0;
      }
    })();

    return {
      usedBytes,
      maxBytes: STORAGE_MAX_BYTES,
      percent: Math.min(percent, 100),
      receiptsCount,
      formattedUsed: formatBytes(usedBytes),
      formattedMax: formatBytes(STORAGE_MAX_BYTES),
      isWarning: percent >= STORAGE_WARNING_PERCENT,
      isCritical: percent >= STORAGE_CRITICAL_PERCENT,
    };
  } catch (error) {
    console.error('storage: failed to get info:', error);
    return {
      usedBytes: 0,
      maxBytes: STORAGE_MAX_BYTES,
      percent: 0,
      receiptsCount: 0,
      formattedUsed: '0 Б',
      formattedMax: formatBytes(STORAGE_MAX_BYTES),
      isWarning: false,
      isCritical: false,
    };
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Б';
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}

export function addItemToCurrentReceipt(state, title, price, categoryMeta) {
  const newItem = {
    id: generateId(),
    title: title,
    price: price,
    category: categoryMeta?.category || 'other',
    autoCategory: categoryMeta?.autoCategory || categoryMeta?.category || 'other',
    categorySource: categoryMeta?.categorySource || 'auto',
    categoryConfidence:
      typeof categoryMeta?.categoryConfidence === 'number'
        ? categoryMeta.categoryConfidence
        : 0.5,
    createdAt: getCurrentTimestamp()
  };

  return {
    ...state,
    currentReceipt: {
      ...state.currentReceipt,
      items: [...state.currentReceipt.items, newItem]
    }
  };
}

export function removeItemFromCurrentReceipt(state, itemId) {
  return {
    ...state,
    currentReceipt: {
      ...state.currentReceipt,
      items: state.currentReceipt.items.filter(item => item.id !== itemId)
    }
  };
}

export function editItemPrice(state, itemId, newPrice) {
  return {
    ...state,
    currentReceipt: {
      ...state.currentReceipt,
      items: state.currentReceipt.items.map(item =>
        item.id === itemId
          ? { ...item, price: newPrice }
          : item
      )
    }
  };
}

export function editItemCategory(state, itemId, newCategory) {
  return {
    ...state,
    currentReceipt: {
      ...state.currentReceipt,
      items: state.currentReceipt.items.map(item =>
        item.id === itemId
          ? {
              ...item,
              category: newCategory,
              categorySource: 'manual',
            }
          : item
      )
    }
  };
}

export function clearCurrentReceipt(state) {
  return {
    ...state,
    currentReceipt: {
      items: []
    }
  };
}

export function saveCurrentReceipt(state) {
  const items = state.currentReceipt.items;

  if (items.length === 0) {
    return { state, receipt: null };
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const totalRounded = Math.round(total * 100) / 100;

  // Если редактируем существующий чек — сохраняем его оригинальную дату и id
  const editingId = state.currentReceipt._editingReceiptId;
  const editingDate = state.currentReceipt._editingReceiptDate;
  const editingCreatedAt = state.currentReceipt._editingReceiptCreatedAt;

  const newReceipt = {
    id: editingId || generateId(),
    date: editingDate || getCurrentDate(),
    createdAt: editingCreatedAt || getCurrentTimestamp(),
    // При редактировании добавляем метку последнего изменения
    updatedAt: editingId ? getCurrentTimestamp() : undefined,
    items: [...items],
    total: totalRounded,
  };

  // Если это редактирование — вставляем чек на его оригинальное место по дате,
  // иначе добавляем в начало
  let newSavedReceipts;
  if (editingId) {
    // Вставляем чек и сортируем по createdAt чтобы он встал на своё место
    newSavedReceipts = [...state.savedReceipts, newReceipt].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  } else {
    newSavedReceipts = [newReceipt, ...state.savedReceipts];
  }

  const newState = {
    ...state,
    currentReceipt: { items: [] },
    savedReceipts: newSavedReceipts,
  };

  return { state: newState, receipt: newReceipt };
}

export function deleteSavedReceipt(state, receiptId) {
  return {
    ...state,
    savedReceipts: state.savedReceipts.filter(r => r.id !== receiptId)
  };
}

export function deleteAllSavedReceipts(state) {
  return {
    ...state,
    savedReceipts: []
  };
}

export function getReceiptById(state, receiptId) {
  return state.savedReceipts.find(r => r.id === receiptId) || null;
}

export function getReceiptsByPeriod(state, period) {
  if (period === 'all') {
    return state.savedReceipts;
  }

  const now = new Date();
  let startDate;

  if (period === 'week') {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 1);
  } else {
    return state.savedReceipts;
  }

  const startStr = startDate.toISOString().split('T')[0];

  return state.savedReceipts.filter(r => r.date >= startStr);
}

export function calculateTotal(receipts) {
  const total = receipts.reduce((sum, r) => sum + r.total, 0);
  return Math.round(total * 100) / 100;
}

export function calculateCategoryStats(receipts, categories) {
  const totals = {};

  receipts.forEach(receipt => {
    receipt.items.forEach(item => {
      const cat = item.category || 'other';
      if (!totals[cat]) {
        totals[cat] = { total: 0, count: 0 };
      }
      totals[cat].total += item.price;
      totals[cat].count += 1;
    });
  });

  const grandTotal = Object.values(totals).reduce((sum, cat) => sum + cat.total, 0);

  const stats = [];

  for (const [key, data] of Object.entries(totals)) {
    const categoryInfo = categories.find(c => c.key === key);
    const percent = grandTotal > 0
      ? Math.round((data.total / grandTotal) * 1000) / 10
      : 0;

    stats.push({
      key,
      name: categoryInfo ? categoryInfo.name : 'Другое',
      color: categoryInfo ? categoryInfo.color : '#B0BEC5',
      total: Math.round(data.total * 100) / 100,
      percent,
      count: data.count
    });
  }

  stats.sort((a, b) => b.total - a.total);

  return stats;
}

export function getCategoryTotal(receipts, categoryKey) {
  let total = 0;
  let count = 0;

  receipts.forEach(receipt => {
    receipt.items.forEach(item => {
      if (item.category === categoryKey) {
        total += item.price;
        count += 1;
      }
    });
  });

  return {
    total: Math.round(total * 100) / 100,
    count
  };
}

export function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('storage: failed to clear data:', error);
    return { success: false, error: error.message };
  }
}

export function updateLastExportedAt(state) {
  return {
    ...state,
    lastExportedAt: getCurrentTimestamp()
  };
}