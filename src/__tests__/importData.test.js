// src/__tests__/importData.test.js

import { importFromJSON, mergeImportedState } from '../utils/importData';

describe('importFromJSON', () => {
  test('Отклоняет null файл', async () => {
    const result = await importFromJSON(null);
    expect(result.success).toBe(false);
    expect(result.error).toBe('no_file');
  });

  test('Отклоняет не-JSON файл', async () => {
    const file = new File(['hello'], 'data.txt', { type: 'text/plain' });
    const result = await importFromJSON(file);
    expect(result.success).toBe(false);
    expect(result.error).toBe('wrong_format');
  });

  test('Импортирует корректный JSON', async () => {
    const data = {
      appName: 'ЧекВойс',
      receipts: [
        {
          id: 'r1',
          date: '2025-01-15',
          items: [
            { title: 'Молоко', price: 89.50, category: 'dairy' }
          ],
          total: 89.50
        }
      ]
    };

    const file = new File(
      [JSON.stringify(data)],
      'backup.json',
      { type: 'application/json' }
    );

    const result = await importFromJSON(file);
    expect(result.success).toBe(true);
    expect(result.stats.receiptsImported).toBe(1);
  });

  test('Отклоняет JSON без чеков', async () => {
    const data = { appName: 'ЧекВойс' };
    const file = new File([JSON.stringify(data)], 'bad.json', { type: 'application/json' });
    const result = await importFromJSON(file);
    expect(result.success).toBe(false);
  });

  test('Отклоняет товар без названия', async () => {
    const data = {
      receipts: [
        { items: [{ price: 89 }] }
      ]
    };
    const file = new File([JSON.stringify(data)], 'bad.json', { type: 'application/json' });
    const result = await importFromJSON(file);
    expect(result.success).toBe(false);
  });
});


describe('mergeImportedState', () => {
  test('replace — заменяет полностью', () => {
    const existing = { savedReceipts: [{ id: 'old' }] };
    const imported = { savedReceipts: [{ id: 'new' }] };
    const result = mergeImportedState(existing, imported, 'replace');
    expect(result.savedReceipts).toHaveLength(1);
    expect(result.savedReceipts[0].id).toBe('new');
  });

  test('merge — объединяет без дубликатов', () => {
    const existing = {
      savedReceipts: [
        { id: 'r1', createdAt: '2025-01-15T18:00:00.000Z' }
      ]
    };
    const imported = {
      savedReceipts: [
        { id: 'r1', createdAt: '2025-01-15T18:00:00.000Z' },  // дубликат
        { id: 'r2', createdAt: '2025-01-14T18:00:00.000Z' }   // новый
      ]
    };
    const result = mergeImportedState(existing, imported, 'merge');
    expect(result.savedReceipts).toHaveLength(2);
  });
});