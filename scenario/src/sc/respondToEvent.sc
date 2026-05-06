theme: /

    state: ГолосовойОтвет
        event!: voice_response

        script:
            var eventData = $context.request.data.eventData || {};
            var text = eventData.text || "";
            if (text) {
                $reactions.answer(text);
            }

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

        a: Не поняла. Назовите товар и цену.

    state: ЧекСохранён
        event!: receipt_saved

    state: ОтветПоКатегории
        event!: category_answer

    state: ЧекПуст
        event!: receipt_empty

    state: ТоварНеНайден
        event!: item_not_found