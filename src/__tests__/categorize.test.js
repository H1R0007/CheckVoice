import { categorize } from '../utils/categorize';

const TEST_CASES = [
  // === Базовые ===
  { input: "Молоко", expected: "dairy" },
  { input: "Молоко Простоквашино 3.2%", expected: "dairy" },
  { input: "Кефир 1%", expected: "dairy" },
  { input: "Сыр Российский", expected: "dairy" },
  { input: "Сырок глазированный", expected: "dairy" },
  
  { input: "Говядина", expected: "meat" },
  { input: "Куриная грудка", expected: "meat" },
  { input: "Фарш свиной", expected: "meat" },
  { input: "Печень куриная", expected: "meat" },
  { input: "Пельмени", expected: "meat" },
  
  { input: "Колбаса Докторская", expected: "deli" },
  { input: "Сосиски Молочные", expected: "deli" },
  { input: "Ветчина", expected: "deli" },
  { input: "Бекон нарезка", expected: "deli" },
  
  { input: "Сёмга", expected: "fish" },
  { input: "Минтай филе", expected: "fish" },
  { input: "Креветки", expected: "fish" },
  { input: "Печень трески", expected: "fish" },
  { input: "Крабовые палочки", expected: "fish" },
  { input: "Икра красная", expected: "fish" },
  { input: "Морская капуста", expected: "fish" },
  
  { input: "Хлеб Бородинский", expected: "bread" },
  { input: "Батон нарезной", expected: "bread" },
  { input: "Круассан", expected: "bread" },
  { input: "Лаваш", expected: "bread" },
  { input: "Пирожки с мясом", expected: "bread" },
  
  { input: "Яблоки Гала", expected: "fruits" },
  { input: "Бананы", expected: "fruits" },
  { input: "Клубника", expected: "fruits" },
  { input: "Авокадо", expected: "fruits" },
  { input: "Курага", expected: "fruits" },
  { input: "Сливы", expected: "fruits" },
  
  { input: "Картофель", expected: "vegetables" },
  { input: "Помидоры", expected: "vegetables" },
  { input: "Огурцы", expected: "vegetables" },
  { input: "Шампиньоны", expected: "vegetables" },
  { input: "Лук репчатый", expected: "vegetables" },
  { input: "Укроп", expected: "vegetables" },
  
  { input: "Гречка", expected: "cereals" },
  { input: "Рис Басмати", expected: "cereals" },
  { input: "Спагетти", expected: "cereals" },
  { input: "Мука пшеничная", expected: "cereals" },
  { input: "Овсяные хлопья", expected: "cereals" },
  
  { input: "Кетчуп", expected: "canned" },
  { input: "Майонез", expected: "canned" },
  { input: "Масло подсолнечное", expected: "canned" },
  { input: "Оливки", expected: "canned" },
  { input: "Томатная паста", expected: "canned" },
  { input: "Мёд", expected: "canned" },
  
  { input: "Замороженная пицца", expected: "frozen" },
  { input: "Наггетсы", expected: "frozen" },
  { input: "Пломбир", expected: "frozen" },
  { input: "Мороженое", expected: "frozen" },
  
  { input: "Перец чёрный молотый", expected: "spices" },
  { input: "Корица", expected: "spices" },
  { input: "Соль", expected: "spices" },
  { input: "Лавровый лист", expected: "spices" },
  { input: "Приправа для курицы", expected: "spices" },
  
  { input: "Сок яблочный", expected: "drinks_nonalc" },
  { input: "Чай зелёный", expected: "drinks_nonalc" },
  { input: "Кофе молотый", expected: "drinks_nonalc" },
  { input: "Кока-кола", expected: "drinks_nonalc" },
  { input: "Вода минеральная", expected: "drinks_nonalc" },
  
  { input: "Пиво Балтика", expected: "drinks_alc" },
  { input: "Вино красное сухое", expected: "drinks_alc" },
  { input: "Водка", expected: "drinks_alc" },
  { input: "Шампанское", expected: "drinks_alc" },
  
  { input: "Шоколад Алёнка", expected: "sweets" },
  { input: "Печенье овсяное", expected: "sweets" },
  { input: "Чипсы", expected: "sweets" },
  { input: "Батончик Сникерс", expected: "sweets" },
  { input: "Орехи кешью", expected: "sweets" },
  { input: "Сахар", expected: "sweets" },
  { input: "Торт Наполеон", expected: "sweets" },
  
  { input: "Детское пюре Фрутоняня", expected: "baby" },
  { input: "Подгузники Памперс", expected: "baby" },
  { input: "Агуша", expected: "baby" },
  
  { input: "Корм для кошек Вискас", expected: "pets" },
  { input: "Наполнитель кошачий", expected: "pets" },
  { input: "Педигри", expected: "pets" },
  
  { input: "Фейри", expected: "household" },
  { input: "Стиральный порошок", expected: "household" },
  { input: "Мешки для мусора", expected: "household" },
  { input: "Губка для посуды", expected: "household" },
  
  { input: "Шампунь", expected: "hygiene" },
  { input: "Зубная паста Колгейт", expected: "hygiene" },
  { input: "Туалетная бумага", expected: "hygiene" },
  { input: "Дезодорант", expected: "hygiene" },
  
  // === Коллизии ===
  { input: "Печень куриная", expected: "meat" },
  { input: "Печенье", expected: "sweets" },
  { input: "Печень трески", expected: "fish" },
  { input: "Батон", expected: "bread" },
  { input: "Батончик", expected: "sweets" },
  { input: "Нектарин", expected: "fruits" },
  { input: "Сливы", expected: "fruits" },
  { input: "Сливки", expected: "dairy" },
  { input: "Фасоль стручковая", expected: "vegetables" },
  { input: "Фасоль", expected: "cereals" },
  { input: "Перец болгарский", expected: "vegetables" },
  { input: "Перец чёрный", expected: "spices" },
  { input: "Морская капуста", expected: "fish" },
  { input: "Капуста белокочанная", expected: "vegetables" },
  { input: "Масло сливочное", expected: "dairy" },
  { input: "Масло подсолнечное", expected: "canned" },
  { input: "Икра красная", expected: "fish" },
  { input: "Икра кабачковая", expected: "canned" },
  { input: "Тоник", expected: "drinks_nonalc" },
  { input: "Тоник для лица", expected: "hygiene" },
  { input: "Копчёная скумбрия", expected: "fish" },
  { input: "Соль", expected: "spices" },
  { input: "Фасоль", expected: "cereals" },
  { input: "Детское мыло", expected: "baby" },
  
  // === Edge cases ===
  { input: "Что-то непонятное", expected: "other" },
  { input: "Пакет", expected: "household" },
  { input: "Жвачка Орбит", expected: "sweets" },
  { input: "Замороженная клубника", expected: "fruits" },
  { input: "Скумбрия копчёная", expected: "fish" },
];

describe('categorize', () => {
  TEST_CASES.forEach(({ input, expected }) => {
    test(`"${input}" -> ${expected}`, () => {
      expect(categorize(input)).toBe(expected);
    });
  });
});