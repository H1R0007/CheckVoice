# JavaScript
require: js/getters.js
require: js/reply.js
require: js/actions.js

# ============================================
# ВЫСШИЙ ПРИОРИТЕТ (чтобы не попали в Fallback)
# ============================================
require: sc/help.sc
require: sc/cancel.sc

# ============================================
# Информационные команды (ВАЖНО: ДО addItem)
# ============================================
require: sc/readReceipt.sc
require: sc/askTotal.sc
require: sc/askItemPrice.sc
require: sc/askCategory.sc

# ============================================
# Управление чеком
# ============================================
require: sc/navigate.sc
require: sc/saveReceipt.sc
require: sc/clearReceipt.sc
require: sc/editPrice.sc
require: sc/deleteItem.sc

# ============================================
# Добавление (только явные команды)
# ============================================
require: sc/addItem.sc

# ============================================
# События
# ============================================
require: sc/respondToEvent.sc

patterns:
    $AnyText = $nonEmptyGarbage

theme: /

    state: Start
        q!: $regex</start>
        q!: (запусти|открой|вруби|включи|старт|start) * (чек|чек войс|checkvoice|check voice)
        q!: (запусти|открой) * (приложение|навык|смартап) * чек

        script:
            navigateTo("newReceipt", $context);
            $reactions.answer("ЧекВойс запущен. Называйте товар и цену.");

    state: Fallback
        event!: noMatch

        script:
            var query = ($context.request.query || "").trim();
            var lowerQuery = query.toLowerCase();

            // Игнорируем пустые или слишком короткие
            if (!query || query.length < 2) {
                return;
            }

            // Игнорируем короткие фразы запуска
            var launchWords = ["запусти", "открой", "чеквойс", "checkvoice", "старт", "start"];
            for (var i = 0; i < launchWords.length; i++) {
                if (lowerQuery.indexOf(launchWords[i]) !== -1 && query.split(' ').length < 3) {
                    return;
                }
            }

            // ПРИОРИТЕТ: Если есть цифры или ценовые слова → это товар
            var hasDigits = /\d/.test(query);
            var hasPriceWords = /(рубл|руб|копеек|коп|полтора|половин|четверть)/i.test(query);

            if (hasDigits || hasPriceWords) {
                addItem(query, $context);
                return;
            }

            // Если 2+ слова без цифр → тоже пробуем добавить (например, "молоко")
            var wordCount = query.split(/\s+/).length;
            if (wordCount >= 1) {
                addItem(query, $context);
            } else {
                $reactions.answer("Не понял. Скажите товар и цену, например: молоко 90 рублей.");
            }