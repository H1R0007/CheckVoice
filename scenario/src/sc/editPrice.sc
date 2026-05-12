theme: /

    state: РедактированиеЦены
        q!: (~изменить|измени|~поменять|поменяй|~исправить|исправь) цену $AnyText::itemText [на] *
        q!: (~изменить|измени|~поменять|поменяй) стоимость $AnyText::itemText [на] *
        q!: (~исправить|исправь) цену у $AnyText::itemText [на] *
        
        # Специальный паттерн для конструкции "измени молоко на 100"
        # Проверяем, чтобы после "на" шло число
        q!: (~изменить|измени|~поменять|поменяй) $AnyText::itemText на $regex<\d+>

        script:
            var text = $context.request.query; 
            if (text) {
                editPriceByName(text, $context);
            } else {
                $reactions.answer("Скажите название товара и новую цену.");
            }