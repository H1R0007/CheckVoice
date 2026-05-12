theme: /

    state: ГолосовойОтвет
        event!: voice_response
        # Пустое состояние. React-приложение само управляет озвучкой через Assistant SDK.

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
        a: Не понял. Скажите название и цену, например: молоко 89 рублей.

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

    # ===== НОВЫЕ СОБЫТИЯ =====

    state: ТоварДобавлен
        event!: item_added
        script:
            var eventData = $context.request.data.eventData || {};
            var title = eventData.title || "товар";
            var price = eventData.price || 0;
            $reactions.answer(title + " за " + price + " рублей добавлен.");

    state: ТоварУдалён
        event!: item_deleted
        script:
            var eventData = $context.request.data.eventData || {};
            var title = eventData.title || "товар";
            $reactions.answer(title + " удалён из чека.");

    state: ЦенаИзменена
        event!: price_edited
        script:
            var eventData = $context.request.data.eventData || {};
            var title = eventData.title || "товар";
            var newPrice = eventData.newPrice || 0;
            $reactions.answer("Цена " + title + " изменена на " + newPrice + " рублей.");

    state: ЧекОчищен
        event!: receipt_cleared
        a: Чек очищен.

    state: ОтменаВыполнена
        event!: cancel_done
        a: Отменено.

    state: ИтогоЧека
        event!: receipt_total
        script:
            var eventData = $context.request.data.eventData || {};
            var total = eventData.total || 0;
            var count = eventData.count || 0;
            if (count > 0) {
                $reactions.answer("В чеке " + count + " позиций на " + total + " рублей.");
            } else {
                $reactions.answer("Чек пустой.");
            }

    state: ЧекПрочитан
        event!: receipt_read
        script:
            var eventData = $context.request.data.eventData || {};
            var items = eventData.items || [];
            if (items.length === 0) {
                $reactions.answer("Чек пустой.");
                return;
            }
            
            var text = "В чеке " + items.length + " позиций: ";
            for (var i = 0; i < items.length; i++) {
                text += items[i].title + " за " + items[i].price + " рублей";
                if (i < items.length - 1) {
                    text += ", ";
                }
            }
            $reactions.answer(text);

    state: ЦенаТовараВЧеке
        event!: item_price_in_receipt
        script:
            var eventData = $context.request.data.eventData || {};
            var title = eventData.title || "";
            var price = eventData.price || 0;
            if (price > 0) {
                $reactions.answer(title + " стоит " + price + " рублей.");
            } else {
                $reactions.answer("Товар " + title + " не найден в чеке.");
            }

    state: ПоследнееОтменено
        event!: last_item_undone
        script:
            var eventData = $context.request.data.eventData || {};
            var title = eventData.title || "последнее добавление";
            $reactions.answer(title + " отменено.");

    state: ЧекОткрыт
        event!: receipt_opened
        script:
            var eventData = $context.request.data.eventData || {};
            var date = eventData.date || "";
            var count = eventData.count || 0;
            var total = eventData.total || 0;
            $reactions.answer("Открыт чек от " + date + ": " + count + " позиций на " + total + " рублей.");

    state: ЧекЗагруженДляРедактирования
        event!: receipt_loaded_for_edit
        script:
            var eventData = $context.request.data.eventData || {};
            var date = eventData.date || "";
            var count = eventData.count || 0;
            $reactions.answer("Чек от " + date + " загружен для редактирования. " + count + " позиций.");

    state: ЧекУдалён
        event!: receipt_deleted
        script:
            var eventData = $context.request.data.eventData || {};
            var date = eventData.date || "";
            $reactions.answer("Чек от " + date + " удалён.");

    state: СтатистикаПоПериоду
        event!: period_total
        script:
            var eventData = $context.request.data.eventData || {};
            var total = eventData.total || 0;
            var period = eventData.period || "за всё время";
            var count = eventData.count || 0;
            $reactions.answer("Потрачено " + period + ": " + total + " рублей в " + count + " чеках.");