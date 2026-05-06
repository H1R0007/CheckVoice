require: slotfilling/slotFilling.sc
  module = sys.zb-common

# JavaScript
require: js/getters.js
require: js/reply.js
require: js/actions.js

# Сценарии — ПОРЯДОК ОПРЕДЕЛЯЕТ ПРИОРИТЕТ
# 1. Точные команды (конкретные ключевые слова)
require: sc/help.sc
require: sc/saveReceipt.sc
require: sc/clearReceipt.sc
require: sc/navigate.sc
require: sc/askTotal.sc
require: sc/editPrice.sc

# 2. Команды с параметрами (более строгие паттерны)
require: sc/deleteItem.sc
require: sc/askCategory.sc

# 3. Добавление товара (широкий паттерн, но с ключевым словом)
require: sc/addItem.sc

# 4. Ответы на события
require: sc/respondToEvent.sc

patterns:
    $AnyText = $nonEmptyGarbage

theme: /

    state: Start
        q!: $regex</start>
        q!: (запусти|открой|вруби) * (чек|чеквойс|checkvoice|check voice)

        script:
            addAction({ type: "navigate", screen: "newReceipt" }, $context);

    state: Fallback
        event!: noMatch

        script:
            var query = $context.request.query || "";
            if (query && query.length > 1) {
                var hasLetters = /[а-яёa-z]/i.test(query);
                var hasDigits = /\d/.test(query);
                if (hasLetters || hasDigits) {
                    addItem(query, $context);
                }
            }