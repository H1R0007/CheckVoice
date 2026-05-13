theme: /

    state: ТоварДобавлен
        event!: item_added
        script:
            var params = get_event_params($context) || {};
            var title = params.title || "товар";
            var price = (typeof params.price === "number") ? params.price : 0;
            $reactions.answer(title + " за " + price + " рублей. Готово!");