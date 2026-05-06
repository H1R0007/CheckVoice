// src/__tests__/parseVoiceInput.test.js

import { parseVoiceInput } from '../utils/parseVoiceInput';

describe('parseVoiceInput', () => {

  // ==========================================
  // Группа 1: Стандартные форматы
  // ==========================================
  
  describe('Стандартные форматы', () => {
    
    test('Товар + число + "рублей"', () => {
      const result = parseVoiceInput('Молоко 89 рублей');
      expect(result.title).toBe('Молоко');
      expect(result.price).toBe(89);
    });

    test('Товар + число + "руб"', () => {
      const result = parseVoiceInput('Хлеб белый 45 руб');
      expect(result.title).toBe('Хлеб белый');
      expect(result.price).toBe(45);
    });

    test('Товар + число (без "рублей")', () => {
      const result = parseVoiceInput('Курица филе 340');
      expect(result.title).toBe('Курица филе');
      expect(result.price).toBe(340);
    });

    test('Товар + число + "рублей" + число + "копеек"', () => {
      const result = parseVoiceInput('Молоко 89 рублей 50 копеек');
      expect(result.title).toBe('Молоко');
      expect(result.price).toBe(89.50);
    });

    test('Товар + число + "руб" + число + "коп"', () => {
      const result = parseVoiceInput('Сыр 234 руб 99 коп');
      expect(result.title).toBe('Сыр');
      expect(result.price).toBe(234.99);
    });

    test('Товар + число + "рублей и" + число + "копеек"', () => {
      const result = parseVoiceInput('Масло 189 рублей и 90 копеек');
      expect(result.title).toBe('Масло');
      expect(result.price).toBe(189.90);
    });
  });

  // ==========================================
  // Группа 2: Десятичные числа
  // ==========================================
  
  describe('Десятичные числа', () => {
    
    test('Точка как разделитель', () => {
      const result = parseVoiceInput('Молоко 89.50');
      expect(result.title).toBe('Молоко');
      expect(result.price).toBe(89.50);
    });

    test('Запятая как разделитель', () => {
      const result = parseVoiceInput('Молоко 89,50');
      expect(result.title).toBe('Молоко');
      expect(result.price).toBe(89.50);
    });

    test('Десятичное + "рублей"', () => {
      const result = parseVoiceInput('Хлеб 45.90 рублей');
      expect(result.title).toBe('Хлеб');
      expect(result.price).toBe(45.90);
    });
  });

  // ==========================================
  // Группа 3: Тысячи
  // ==========================================
  
  describe('Тысячи', () => {
    
    test('Число + "тысяч"', () => {
      const result = parseVoiceInput('Телевизор 45 тысяч');
      expect(result.title).toBe('Телевизор');
      expect(result.price).toBe(45000);
    });

    test('Число + "тысячи" + число', () => {
      const result = parseVoiceInput('Куртка 3 тысячи 500');
      expect(result.title).toBe('Куртка');
      expect(result.price).toBe(3500);
    });

    test('"тысяча" + число + "рублей"', () => {
      const result = parseVoiceInput('Обувь 1 тысяча 200 рублей');
      expect(result.title).toBe('Обувь');
      expect(result.price).toBe(1200);
    });
  });

  // ==========================================
  // Группа 4: Позиция цены
  // ==========================================

  describe('Разная позиция цены', () => {

    test('Цена в начале', () => {
      const result = parseVoiceInput('89 рублей молоко');
      expect(result.title).toBe('Молоко');
      expect(result.price).toBe(89);
    });

    test('"стоит" перед ценой', () => {
      const result = parseVoiceInput('Молоко стоит 89 рублей');
      expect(result.title).toBe('Молоко');
      expect(result.price).toBe(89);
    });

    test('"по" перед ценой', () => {
      const result = parseVoiceInput('Яблоки по 120 рублей');
      expect(result.title).toBe('Яблоки');
      expect(result.price).toBe(120);
    });

    test('"за" перед ценой', () => {
      const result = parseVoiceInput('Хлеб за 45 рублей');
      expect(result.title).toBe('Хлеб');
      expect(result.price).toBe(45);
    });
  });

  // ==========================================
  // Группа 5: Составные названия
  // ==========================================

  describe('Составные названия', () => {
    
    test('Название из двух слов', () => {
      const result = parseVoiceInput('Хлеб белый 45');
      expect(result.title).toBe('Хлеб белый');
      expect(result.price).toBe(45);
    });

    test('Название из трёх слов', () => {
      const result = parseVoiceInput('Молоко Простоквашино отборное 89');
      expect(result.title).toBe('Молоко простоквашино отборное');
      expect(result.price).toBe(89);
    });

    test('Название с процентами', () => {
      const result = parseVoiceInput('Молоко 3.2% 89 рублей');
      // Сложный случай: "3.2" может быть распознано как цена
      // Но "89 рублей" — более явная цена (есть слово "рублей")
      expect(result.price).toBe(89);
      // Название может содержать "3.2%" — зависит от реализации
    });

    test('Бренд в названии', () => {
      const result = parseVoiceInput('Coca-Cola 1.5л 120 рублей');
      expect(result.price).toBe(120);
    });
  });

  // ==========================================
  // Группа 6: Неполный ввод
  // ==========================================

  describe('Неполный ввод', () => {
    
    test('Только товар (без цены)', () => {
      const result = parseVoiceInput('Молоко');
      expect(result.title).toBe('Молоко');
      expect(result.price).toBeNull();
    });

    test('Только цена (без товара)', () => {
      const result = parseVoiceInput('89 рублей');
      expect(result.title).toBeNull();
      expect(result.price).toBe(89);
    });

    test('Пустая строка', () => {
      const result = parseVoiceInput('');
      expect(result.title).toBeNull();
      expect(result.price).toBeNull();
      expect(result.error).toBe('empty_input');
    });

    test('null', () => {
      const result = parseVoiceInput(null);
      expect(result.error).toBe('empty_input');
    });
  });

  // ==========================================
  // Группа 7: Граничные значения цены
  // ==========================================

  describe('Граничные значения', () => {
    
    test('Нулевая цена', () => {
      const result = parseVoiceInput('Пакет 0 рублей');
      expect(result.title).toBe('Пакет');
      expect(result.price).toBe(0);
    });

    test('Очень большая цена', () => {
      const result = parseVoiceInput('Телевизор 450000');
      expect(result.title).toBe('Телевизор');
      expect(result.price).toBe(450000);
    });

    test('Цена больше миллиона → предупреждение', () => {
      const result = parseVoiceInput('Что-то 2000000');
      expect(result.price).toBe(2000000);
      expect(result.warning).toBe('very_high_price');
    });

    test('Копейки 99', () => {
      const result = parseVoiceInput('Молоко 89 рублей 99 копеек');
      expect(result.price).toBe(89.99);
    });

    test('Копейки 01', () => {
      const result = parseVoiceInput('Хлеб 45 рублей 1 копейка');
      expect(result.price).toBe(45.01);
    });
  });

  // ==========================================
  // Группа 8: Регистр и пробелы
  // ==========================================

  describe('Нормализация', () => {
    
    test('ВЕРХНИЙ РЕГИСТР', () => {
      const result = parseVoiceInput('МОЛОКО 89 РУБЛЕЙ');
      expect(result.title).toBe('Молоко');
      expect(result.price).toBe(89);
    });

    test('Лишние пробелы', () => {
      const result = parseVoiceInput('  Молоко   89   рублей  ');
      expect(result.title).toBe('Молоко');
      expect(result.price).toBe(89);
    });

    test('Смешанный регистр', () => {
      const result = parseVoiceInput('мОлОкО 89');
      expect(result.title).toBe('Молоко');
      expect(result.price).toBe(89);
    });
  });

  // ==========================================
  // Группа 9: Проблемные кейсы
  // ==========================================

  describe('Проблемные кейсы', () => {

    test('Два числа без контекста', () => {
      // "молоко 3 89" — 3 = количество? жирность? 89 = цена?
      // Берём последнее число как цену
      const result = parseVoiceInput('Молоко 3 89');
      expect(result.price).toBe(89);
    });

    test('Число в названии бренда', () => {
      // "7up 89 рублей" — 7 это часть бренда, 89 цена
      // Поскольку "89 рублей" матчится стратегией A, 89 — цена
      const result = parseVoiceInput('7up 89 рублей');
      expect(result.price).toBe(89);
    });

    test('Только стоп-слова', () => {
      const result = parseVoiceInput('рублей копеек');
      expect(result.title).toBeNull();
      expect(result.price).toBeNull();
    });
  });
});