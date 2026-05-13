theme: /

    state: РедактированиеЦены
        q!: (~изменить|измени|~поменять|поменяй|~исправить|исправь) [цену|стоимость] $AnyText::itemText
        q!: (~изменить|измени) $AnyText::itemText на *

        script:
            var text = $context.request.query;
            if (text && text.length > 0) {
                editPriceByName(text, $context);
                $reactions.answer("Меняю цену.");
            } else {
                $reactions.answer("Скажите товар и новую цену.");
            }