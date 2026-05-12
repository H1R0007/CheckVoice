theme: /

    # =============================================
    # Запрос цены конкретного товара ИЗ ЧЕКА
    # =============================================

    state: СколькоСтоитТоварВЧеке
        q!: сколько стоит $AnyText::itemName [в чеке]
        q!: какая цена $AnyText::itemName [в чеке]
        q!: сколько [у меня] $AnyText::itemName [в чеке]
        q!: цена $AnyText::itemName [в чеке]
        q!: за сколько $AnyText::itemName [в чеке]

        script:
            var text = $parseTree._itemName;
            if (text) {
                addAction({ type: "ask_item_price", itemName: text }, $context);
            } else {
                $reactions.answer("Скажите название товара.");
            }