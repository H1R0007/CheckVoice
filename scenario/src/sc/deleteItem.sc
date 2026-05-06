theme: /

    state: ”даление“овара
        q!: (~удалить|удали|~убрать|убери) $AnyText::itemText

        script:
            var text = $parseTree._itemText;
            if (text) {
                deleteItem(text, $context);
            }