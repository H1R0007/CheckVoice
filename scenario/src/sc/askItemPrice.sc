theme: /

    state: СколькоСтоитТоварВЧеке
        q!: * сколько * стоит * $AnyText::itemName *
        q!: * какая * цена * $AnyText::itemName *
        q!: * цена * $AnyText::itemName *
        q!: * что * стоит * $AnyText::itemName *

        script:
            var text = $parseTree._itemName;
            if (text) {
                askItemPrice(text, $context);
            } else {
                $reactions.answer("Скажите название товара.");
            }