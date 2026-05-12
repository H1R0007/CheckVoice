theme: /

    state: УдалениеТовара

        q!: (~удалить|удали|~убрать|убери) товар $AnyText::itemText
        q!: (~удалить|удали|~убрать|убери) позицию $AnyText::itemText
        q!: (~удалить|удали|~убрать|убери) из чека $AnyText::itemText

        script:
            var text = $parseTree._itemText;

            if (text) {
                deleteItem(text, $context);
            } else {
                $reactions.answer("Скажите какой товар удалить.");
            }