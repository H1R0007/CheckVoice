theme: /

    state: »зменение÷ены
        q!: (~изменить|измени|~помен€ть|помен€й|~исправить|исправь) [~цена|~цену|~стоимость] * $AnyText::editText
        q!: * (~стоит|~стоило) [не] * $AnyText::editText

        script:
            var text = $parseTree._editText || "";
            if (text) {
                addAction({
                    type: "edit_price_by_name",
                    text: text
                }, $context);
            }