// src/utils/categoryVoiceMap.js

// Маппинг голосовых запросов → ключ категории
const CATEGORY_VOICE_MAP = {
    // dairy
    "молочку": "dairy",
    "молочные": "dairy",
    "молочное": "dairy",
    "молочные продукты": "dairy",
    "молоко": "dairy",

    // meat
    "мясо": "meat",
    "мясное": "meat",
    "мясные": "meat",
    "мясные продукты": "meat",
    "птицу": "meat",

    // deli
    "колбасу": "deli",
    "колбасные": "deli",
    "деликатесы": "deli",
    "сосиски": "deli",

    // fish
    "рыбу": "fish",
    "рыбное": "fish",
    "морепродукты": "fish",
    "рыбные": "fish",

    // bread
    "хлеб": "bread",
    "выпечку": "bread",
    "хлебобулочные": "bread",

    // fruits
    "фрукты": "fruits",
    "ягоды": "fruits",
    "фрукты и ягоды": "fruits",

    // vegetables
    "овощи": "vegetables",
    "зелень": "vegetables",
    "овощи и зелень": "vegetables",

    // cereals
    "крупы": "cereals",
    "макароны": "cereals",
    "муку": "cereals",

    // canned
    "консервы": "canned",
    "соусы": "canned",

    // frozen
    "заморозку": "frozen",
    "замороженное": "frozen",
    "мороженое": "frozen",

    // spices
    "специи": "spices",
    "приправы": "spices",

    // drinks_nonalc
    "напитки": "drinks_nonalc",
    "воду": "drinks_nonalc",
    "соки": "drinks_nonalc",
    "чай": "drinks_nonalc",
    "кофе": "drinks_nonalc",

    // drinks_alc
    "алкоголь": "drinks_alc",
    "спиртное": "drinks_alc",
    "пиво": "drinks_alc",
    "вино": "drinks_alc",

    // sweets
    "сладости": "sweets",
    "сладкое": "sweets",
    "снеки": "sweets",
    "шоколад": "sweets",
    "конфеты": "sweets",
    "орехи": "sweets",

    // baby
    "детское": "baby",
    "детские товары": "baby",
    "детское питание": "baby",

    // pets
    "животных": "pets",
    "корм": "pets",
    "для кошки": "pets",
    "для собаки": "pets",

    // household
    "бытовую химию": "household",
    "бытовую": "household",
    "химию": "household",
    "чистящие": "household",

    // hygiene
    "гигиену": "hygiene",
    "гигиенические": "hygiene",
    "косметику": "hygiene",
};

export function resolveCategoryFromVoice(text) {
    if (!text) return null;
    const lower = text.toLowerCase().trim();

    // Точное совпадение
    if (CATEGORY_VOICE_MAP[lower]) {
        return CATEGORY_VOICE_MAP[lower];
    }

    // Поиск по подстроке
    for (const [phrase, key] of Object.entries(CATEGORY_VOICE_MAP)) {
        if (lower.includes(phrase) || phrase.includes(lower)) {
            return key;
        }
    }

    return null;
}