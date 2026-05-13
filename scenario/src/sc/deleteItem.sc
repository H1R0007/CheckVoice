theme: /

    state: УдалениеТовара
        q!: (~удалить|удали|~убрать|убери) [товар|позицию] $AnyText::itemText
        q!: (~удалить|удали|~убрать|убери) из чека $AnyText::itemText

        script:
            var text = $parseTree._itemText;
            if (text && text.length > 0) {
                deleteItem(text, $context);
                $reactions.answer("Удаляю.");
            } else {
                $reactions.answer("Скажите, что удалить.");
            }