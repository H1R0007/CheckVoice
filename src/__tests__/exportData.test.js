// src/__tests__/exportData.test.js

import { exportToJSON, exportToCSV } from '../utils/exportData';

// Мок для createElement и click
beforeEach(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock');
  global.URL.revokeObjectURL = jest.fn();
  
  const mockLink = {
    href: '',
    download: '',
    click: jest.fn(),
  };
  jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
  jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
  jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
});

function sampleState() {
  return {
    version: 1,
    currentReceipt: { items: [] },
    savedReceipts: [
      {
        id: 'r1',
        date: '2025-01-15',
        createdAt: '2025-01-15T18:00:00.000Z',
        items: [
          { id: 'i1', title: 'Молоко', price: 89.50, category: 'dairy', createdAt: '2025-01-15T14:00:00.000Z' },
          { id: 'i2', title: 'Хлеб', price: 45.00, category: 'bread', createdAt: '2025-01-15T14:01:00.000Z' },
        ],
        total: 134.50
      }
    ],
    lastExportedAt: null
  };
}

describe('exportToJSON', () => {
  test('Возвращает success', () => {
    const result = exportToJSON(sampleState());
    expect(result.success).toBe(true);
    expect(result.filename).toMatch(/checkvoice_backup_.*\.json/);
  });
});

describe('exportToCSV', () => {
  test('Возвращает success', () => {
    const result = exportToCSV(sampleState());
    expect(result.success).toBe(true);
    expect(result.filename).toMatch(/checkvoice_export_.*\.csv/);
  });
});