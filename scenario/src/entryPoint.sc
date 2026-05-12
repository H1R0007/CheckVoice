# JavaScript
require: js/getters.js
require: js/reply.js
require: js/actions.js

# ============================================
# ВЫСШИЙ ПРИОРИТЕТ — команды должны сработать ДО Fallback
# ============================================
require: sc/help.sc
require: sc/cancel.sc
require: sc/navigate.sc

# ============================================
# Информационные команды (ПЕРЕМЕЩЕНЫ ВЫШЕ)
# ============================================
require: sc/readReceipt.sc
require: sc/askTotal.sc
require: sc/askItemPrice.sc
require: sc/askCategory.sc

# ============================================
# Управление чеком
# ============================================
require: sc/saveReceipt.sc
require: sc/clearReceipt.sc
require: sc/editPrice.sc
require: sc/deleteItem.sc

# ============================================
# Добавление товара (только явные команды)
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
        q!: (запусти|открой|вруби|включи|старт|start) * (чек|чеквойс|checkvoice|check voice|чек войс|чек-войс)
        q!: (запусти|открой) * (приложение|навык|смартап) * (чек|чеквойс)

        script:
            addAction({ type: "navigate", screen: "newReceipt" }, $context);
            $reactions.answer("ЧекВойс запущен. Назовите товар и цену, чтобы добавить в чек.");

    state: Fallback
        event!: noMatch

        script:
            var query = ($context.request.query || "").trim();
            var lowerQuery = query.toLowerCase();

            if (!query || query.length < 2) {
                return;
            }

            // Расширенный список стоп-фраз
            var launchPhrases = [
                "запусти", "открой", "чеквойс", "checkvoice", "check voice",
                "чек войс", "чек-войс", "старт", "start", "вруби", "включи",
                "приложение", "навык", "смартап", "смарт", "запустить"
            ];
            
            // Стоп-слова команд (чтобы не попадали в Fallback)
            var commandStopWords = [
                "прочитай", "зачитай", "перечисли", "назови", "скажи",
                "сколько итого", "сколько всего", "какая сумма", "итого",
                "посчитай", "подсчитай", "сколько стоит"
            ];

            for (var i = 0; i < launchPhrases.length; i++) {
                if (lowerQuery.indexOf(launchPhrases[i]) !== -1) {
                    return;
                }
            }

            for (var j = 0; j < commandStopWords.length; j++) {
                if (lowerQuery.indexOf(commandStopWords[j]) !== -1) {
                    return;
                }
            }

            // Короткие фразы (одно слово без цифр) — запрашиваем цену
            var hasDigits = /\d/.test(query);
            var hasPriceWords = /(рубл|руб|копеек|коп|полтора|половин|четверть|тысяч|млн)/i.test(query);
            var wordCount = query.trim().split(/\s+/).length;

            if (hasDigits || hasPriceWords || wordCount >= 2) {
                addItem(query, $context);
            } else if (wordCount === 1) {
                addItem(query, $context);
            } else {
                $reactions.answer("Не понял команду. Скажите, например: Молоко 90 рублей.");
            }