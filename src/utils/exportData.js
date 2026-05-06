// src/utils/exportData.js

import { CATEGORIES } from '../constants/categories';

/**
 * Экспортирует данные в формате JSON (полный бэкап)
 * Скачивает файл через браузер
 */
export function exportToJSON(state) {
  const exportData = {
    exportDate: new Date().toISOString(),
    appName: "ЧекВойс",
    appVersion: "1.0.0",
    dataVersion: state.version,
    receipts: state.savedReceipts,
    currentReceipt: state.currentReceipt,
    categoryLearning: state.categoryLearning,
    stats: {
      totalReceipts: state.savedReceipts.length,
      totalItems: state.savedReceipts.reduce((sum, r) => sum + r.items.length, 0),
      totalSpent: state.savedReceipts.reduce((sum, r) => sum + r.total, 0),
    }
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const filename = `checkvoice_backup_${formatDateForFilename(new Date())}.json`;

  downloadBlob(blob, filename);

  return { success: true, filename };
}

/**
 * Экспортирует данные в формате CSV (для Excel/Google Sheets)
 * Скачивает файл через браузер
 */
export function exportToCSV(state) {
  const BOM = '\uFEFF';

  const headers = [
    'Дата',
    'Товар',
    'Цена',
    'Категория',
    'ID чека'
  ];

  const rows = [];

  state.savedReceipts.forEach(receipt => {
    receipt.items.forEach(item => {
      const categoryInfo = CATEGORIES.find(c => c.key === item.category);
      const categoryName = categoryInfo ? categoryInfo.name : 'Другое';

      rows.push([
        formatDateForCSV(receipt.date),
        escapeCSV(item.title),
        item.price.toFixed(2),
        categoryName,
        receipt.id
      ]);
    });
  });

  if (state.currentReceipt.items.length > 0) {
    state.currentReceipt.items.forEach(item => {
      const categoryInfo = CATEGORIES.find(c => c.key === item.category);
      const categoryName = categoryInfo ? categoryInfo.name : 'Другое';

      rows.push([
        formatDateForCSV(new Date().toISOString().split('T')[0]),
        escapeCSV(item.title),
        item.price.toFixed(2),
        categoryName,
        '(текущий чек)'
      ]);
    });
  }

  const totalSpent = state.savedReceipts.reduce((sum, r) => sum + r.total, 0);
  rows.push([]);
  rows.push([
    '',
    'ИТОГО',
    totalSpent.toFixed(2),
    '',
    ''
  ]);

  rows.push([]);
  rows.push(['', 'СТАТИСТИКА ПО КАТЕГОРИЯМ', '', '', '']);

  const categoryTotals = {};
  state.savedReceipts.forEach(receipt => {
    receipt.items.forEach(item => {
      const cat = item.category || 'other';
      if (!categoryTotals[cat]) categoryTotals[cat] = 0;
      categoryTotals[cat] += item.price;
    });
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a);

  sortedCategories.forEach(([key, total]) => {
    const categoryInfo = CATEGORIES.find(c => c.key === key);
    const name = categoryInfo ? categoryInfo.name : 'Другое';
    const percent = totalSpent > 0
      ? ((total / totalSpent) * 100).toFixed(1)
      : '0.0';

    rows.push([
      '',
      name,
      total.toFixed(2),
      percent + '%',
      ''
    ]);
  });

  const separator = ';';
  const csvContent = BOM +
    headers.join(separator) + '\n' +
    rows.map(row => row.join(separator)).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const filename = `checkvoice_export_${formatDateForFilename(new Date())}.csv`;

  downloadBlob(blob, filename);

  return { success: true, filename };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDateForFilename(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}`;
}

function formatDateForCSV(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function escapeCSV(value) {
  if (!value) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}