// src/__tests__/storage.test.js

import {
  generateId,
  getCurrentDate,
  addItemToCurrentReceipt,
  removeItemFromCurrentReceipt,
  editItemPrice,
  clearCurrentReceipt,
  saveCurrentReceipt,
  deleteSavedReceipt,
  deleteAllSavedReceipts,
  getReceiptsByPeriod,
  calculateTotal,
  calculateCategoryStats,
  getCategoryTotal
} from '../utils/storage';


// Хелпер: создаёт пустое состояние
function emptyState() {
  return {
    version: 1,
    currentReceipt: { items: [] },
    savedReceipts: [],
    lastExportedAt: null
  };
}

// Хелпер: создаёт товар
function makeItem(title, price, category) {
  return { id: generateId(), title, price, category, createdAt: new Date().toISOString() };
}

// Хелпер: создаёт состояние с товарами в текущем чеке
function stateWithItems(items) {
  const state = emptyState();
  items.forEach(([title, price, category]) => {
    state.currentReceipt.items.push(makeItem(title, price, category));
  });
  return state;
}


describe('generateId', () => {
  test('Генерирует строку', () => {
    expect(typeof generateId()).toBe('string');
  });

  test('Генерирует уникальные ID', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });
});


describe('getCurrentDate', () => {
  test('Возвращает дату в формате YYYY-MM-DD', () => {
    const date = getCurrentDate();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});


describe('addItemToCurrentReceipt', () => {
  test('Добавляет товар в пустой чек', () => {
    const state = emptyState();
    const newState = addItemToCurrentReceipt(state, 'Молоко', 89.50, 'dairy');
    expect(newState.currentReceipt.items).toHaveLength(1);
    expect(newState.currentReceipt.items[0].title).toBe('Молоко');
    expect(newState.currentReceipt.items[0].price).toBe(89.50);
    expect(newState.currentReceipt.items[0].category).toBe('dairy');
  });

  test('Добавляет товар к существующим', () => {
    let state = emptyState();
    state = addItemToCurrentReceipt(state, 'Молоко', 89, 'dairy');
    state = addItemToCurrentReceipt(state, 'Хлеб', 45, 'bread');
    expect(state.currentReceipt.items).toHaveLength(2);
  });

  test('Не мутирует исходное состояние', () => {
    const state = emptyState();
    const newState = addItemToCurrentReceipt(state, 'Молоко', 89, 'dairy');
    expect(state.currentReceipt.items).toHaveLength(0);
    expect(newState.currentReceipt.items).toHaveLength(1);
  });
});


describe('removeItemFromCurrentReceipt', () => {
  test('Удаляет товар по ID', () => {
    let state = emptyState();
    state = addItemToCurrentReceipt(state, 'Молоко', 89, 'dairy');
    state = addItemToCurrentReceipt(state, 'Хлеб', 45, 'bread');
    const idToRemove = state.currentReceipt.items[0].id;
    const newState = removeItemFromCurrentReceipt(state, idToRemove);
    expect(newState.currentReceipt.items).toHaveLength(1);
    expect(newState.currentReceipt.items[0].title).toBe('Хлеб');
  });

  test('Не ломается при несуществующем ID', () => {
    let state = emptyState();
    state = addItemToCurrentReceipt(state, 'Молоко', 89, 'dairy');
    const newState = removeItemFromCurrentReceipt(state, 'nonexistent');
    expect(newState.currentReceipt.items).toHaveLength(1);
  });
});


describe('editItemPrice', () => {
  test('Изменяет цену товара', () => {
    let state = emptyState();
    state = addItemToCurrentReceipt(state, 'Молоко', 89, 'dairy');
    const itemId = state.currentReceipt.items[0].id;
    const newState = editItemPrice(state, itemId, 95);
    expect(newState.currentReceipt.items[0].price).toBe(95);
    expect(newState.currentReceipt.items[0].title).toBe('Молоко');
  });
});


describe('clearCurrentReceipt', () => {
  test('Очищает текущий чек', () => {
    let state = emptyState();
    state = addItemToCurrentReceipt(state, 'Молоко', 89, 'dairy');
    state = addItemToCurrentReceipt(state, 'Хлеб', 45, 'bread');
    const newState = clearCurrentReceipt(state);
    expect(newState.currentReceipt.items).toHaveLength(0);
  });
});


describe('saveCurrentReceipt', () => {
  test('Сохраняет чек в историю', () => {
    let state = emptyState();
    state = addItemToCurrentReceipt(state, 'Молоко', 89, 'dairy');
    state = addItemToCurrentReceipt(state, 'Хлеб', 45, 'bread');

    const { state: newState, receipt } = saveCurrentReceipt(state);

    expect(newState.currentReceipt.items).toHaveLength(0);
    expect(newState.savedReceipts).toHaveLength(1);
    expect(receipt.total).toBe(134);
    expect(receipt.items).toHaveLength(2);
    expect(receipt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('Не сохраняет пустой чек', () => {
    const state = emptyState();
    const { state: newState, receipt } = saveCurrentReceipt(state);
    expect(newState.savedReceipts).toHaveLength(0);
    expect(receipt).toBeNull();
  });

  test('Правильно считает total с копейками', () => {
    let state = emptyState();
    state = addItemToCurrentReceipt(state, 'Молоко', 89.50, 'dairy');
    state = addItemToCurrentReceipt(state, 'Хлеб', 45.99, 'bread');
    const { receipt } = saveCurrentReceipt(state);
    expect(receipt.total).toBe(135.49);
  });
});


describe('getReceiptsByPeriod', () => {
  function stateWithReceipts() {
    const state = emptyState();
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    state.savedReceipts = [
      { id: '1', date: today.toISOString().split('T')[0], createdAt: today.toISOString(), items: [], total: 100 },
      { id: '2', date: threeDaysAgo.toISOString().split('T')[0], createdAt: threeDaysAgo.toISOString(), items: [], total: 200 },
      { id: '3', date: tenDaysAgo.toISOString().split('T')[0], createdAt: tenDaysAgo.toISOString(), items: [], total: 300 },
      { id: '4', date: twoMonthsAgo.toISOString().split('T')[0], createdAt: twoMonthsAgo.toISOString(), items: [], total: 400 },
    ];
    return state;
  }

  test('period=all — возвращает все', () => {
    const state = stateWithReceipts();
    expect(getReceiptsByPeriod(state, 'all')).toHaveLength(4);
  });

  test('period=week — последние 7 дней', () => {
    const state = stateWithReceipts();
    const result = getReceiptsByPeriod(state, 'week');
    expect(result).toHaveLength(2); // сегодня + 3 дня назад
  });

  test('period=month — последние 30 дней', () => {
    const state = stateWithReceipts();
    const result = getReceiptsByPeriod(state, 'month');
    expect(result).toHaveLength(3); // сегодня + 3 дня + 10 дней
  });
});


describe('calculateCategoryStats', () => {
  test('Подсчитывает статистику по категориям', () => {
    const receipts = [
      {
        id: '1', date: '2025-01-15', createdAt: '2025-01-15', total: 234.50,
        items: [
          { id: 'a', title: 'Молоко', price: 89.50, category: 'dairy' },
          { id: 'b', title: 'Сыр', price: 145, category: 'dairy' },
        ]
      },
      {
        id: '2', date: '2025-01-14', createdAt: '2025-01-14', total: 385,
        items: [
          { id: 'c', title: 'Курица', price: 340, category: 'meat' },
          { id: 'd', title: 'Хлеб', price: 45, category: 'bread' },
        ]
      }
    ];

    const categories = [
      { key: 'dairy', name: 'Молочные', icon: '🥛', color: '#4FC3F7' },
      { key: 'meat', name: 'Мясо', icon: '🥩', color: '#E57373' },
      { key: 'bread', name: 'Хлеб', icon: '🍞', color: '#FFB74D' },
    ];

    const stats = calculateCategoryStats(receipts, categories);

    expect(stats).toHaveLength(3);
    // Отсортировано по убыванию
    expect(stats[0].key).toBe('meat');
    expect(stats[0].total).toBe(340);
    expect(stats[1].key).toBe('dairy');
    expect(stats[1].total).toBe(234.50);
    expect(stats[2].key).toBe('bread');
    expect(stats[2].total).toBe(45);

    // Проценты
    const grandTotal = 340 + 234.50 + 45;
    expect(stats[0].percent).toBeCloseTo((340 / grandTotal) * 100, 0);
  });
});