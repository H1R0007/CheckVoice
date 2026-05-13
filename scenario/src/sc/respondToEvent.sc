theme: /

    state: ТоварДобавлен
        event!: item_added
        script:
            var params = get_event_params($context) || {};
            var title = params.title || "товар";
            var price = (typeof params.price === "number") ? params.price : 0;
            $reactions.answer(title + " — " + formatMoney(price) + ". Записал!");

    state: ТоварУдалён
        event!: item_deleted
        script:
            var params = get_event_params($context) || {};
            var title = params.title || "товар";
            $reactions.answer("Убрал " + title + " из чека.");

    state: ЦенаИзменена
        event!: price_edited
        script:
            var params = get_event_params($context) || {};
            var title = params.title || "товар";
            var newPrice = (typeof params.newPrice === "number") ? params.newPrice : 0;
            $reactions.answer("Поменял цену " + title + " на " + formatMoney(newPrice) + ".");

    state: ЧекОчищен
        event!: receipt_cleared
        script:
            var params = get_event_params($context) || {};
            var count = (typeof params.count === "number") ? params.count : 0;
            if (count > 0) {
                $reactions.answer("Чек очищен. Убрал " + formatCount(count) + ".");
            } else {
                $reactions.answer("Чек очищен.");
            }

    state: ЧекСохранён
        event!: receipt_saved
        script:
            var params = get_event_params($context) || {};
            var count = (typeof params.count === "number") ? params.count : 0;
            var total = (typeof params.total === "number") ? params.total : 0;
            if (count > 0) {
                $reactions.answer("Чек сохранён: " + formatCount(count) + " на " + formatMoney(total) + ".");
            }

    state: ИтогоЧека
        event!: receipt_total
        script:
            var params = get_event_params($context) || {};
            var total = (typeof params.total === "number") ? params.total : 0;
            var count = (typeof params.count === "number") ? params.count : 0;
            if (count === 0) {
                $reactions.answer("Чек пустой.");
            } else if (count === 1) {
                $reactions.answer("В чеке одна позиция на " + formatMoney(total) + ".");
            } else {
                $reactions.answer("В чеке " + formatCount(count) + " на " + formatMoney(total) + ".");
            }

    state: ЧекПрочитан
        event!: receipt_read
        script:
            var params = get_event_params($context) || {};
            var items = params.items || [];
            var total = (typeof params.total === "number") ? params.total : 0;
            var count = items.length;

            if (count === 0) {
                $reactions.answer("Чек пустой.");
                return;
            }

            var text = "";
            for (var i = 0; i < count; i++) {
                var item = items[i];
                var itemPrice = (typeof item.price === "number") ? item.price : 0;
                text += item.title + " — " + formatMoney(itemPrice);
                if (i < count - 1) text += ". ";
            }
            text += ". Итого " + formatCount(count) + " на " + formatMoney(total) + ".";
            $reactions.answer(text);

    state: ЦенаТовараВЧеке
        event!: item_price_in_receipt
        script:
            var params = get_event_params($context) || {};
            var title = params.title || "";
            var price = (typeof params.price === "number") ? params.price : 0;
            if (price > 0) {
                $reactions.answer(title + " стоит " + formatMoney(price) + ".");
            } else {
                $reactions.answer("Такого товара в чеке нет.");
            }

    state: ОтветПоКатегории
        event!: category_answer
        script:
            var params = get_event_params($context) || {};
            var text = params.text || "";
            if (text) {
                $reactions.answer(text);
            } else {
                $reactions.answer("Данных по этой категории нет.");
            }

    state: СтатистикаПоПериоду
        event!: period_total
        script:
            var params = get_event_params($context) || {};
            var total = (typeof params.total === "number") ? params.total : 0;
            var period = params.period || "за всё время";
            var count = (typeof params.count === "number") ? params.count : 0;
            if (count === 0) {
                $reactions.answer("За этот период покупок не найдено.");
            } else {
                $reactions.answer(
                    period.charAt(0).toUpperCase() + period.slice(1) +
                    " потрачено " + formatMoney(total) + " в " + formatReceipts(count) + "."
                );
            }

    state: ТоварНеНайден
        event!: item_not_found
        a: Такого товара в чеке нет.

    state: ЧекПуст
        event!: receipt_empty
        script:
            var params = get_event_params($context) || {};
            var text = params.text || "Чек пустой.";
            $reactions.answer(text);

    state: ОшибкаРаспознавания
        event!: parse_error
        script:
            var params = get_event_params($context) || {};
            var text = params.text || "Не понял. Скажите товар и цену.";
            $reactions.answer(text);