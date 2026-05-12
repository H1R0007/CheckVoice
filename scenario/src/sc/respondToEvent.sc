theme: /

    state: ГолосовойОтвет
        event!: voice_response
        # Пустое состояние. React-приложение само управляет озвучкой через Assistant SDK.
        # Это предотвращает дублирование звука.

    state: ОтветНаЗапросЦены
        event!: ask_price
        script:
            var eventData = $context.request.data.eventData || {};
            var title = eventData.value || "товар";
            $reactions.answer("Сколько стоит " + title + "?");

    state: ОтветНаЗапросНазвания
        event!: ask_title
        script:
            var eventData = $context.request.data.eventData || {};
            var price = eventData.value || "";
            $reactions.answer("Что стоит " + price + " рублей?");

    state: ОшибкаПарсинга
        event!: parse_error
        a: Не понял. Скажите название и цену, например: молоко 89.

    state: ЧекСохранён
        event!: receipt_saved
        script:
            var eventData = $context.request.data.eventData || {};
            var count = eventData.count || 0;
            var total = eventData.total || 0;
            if (count > 0 && total > 0) {
                $reactions.answer("Чек сохранён. " + count + " позиций на " + total + " рублей.");
            } else {
                $reactions.answer("Чек сохранён.");
            }

    state: ОтветПоКатегории
        event!: category_answer
        script:
            var eventData = $context.request.data.eventData || {};
            var text = eventData.text || "";
            if (text) {
                $reactions.answer(text);
            }

    state: ЧекПуст
        event!: receipt_empty
        a: Чек пустой, добавьте товары.

    state: ТоварНеНайден
        event!: item_not_found
        a: Такого товара в чеке нет. Скажите точное название.