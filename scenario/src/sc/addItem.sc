theme: /

    state: ДобавлениеТовара
        # Слушаем только явные команды добавления. 
        # Строки типа "Молоко 89" уйдут в Fallback для более умной проверки.
        q!: (~добавить|~записать|~внести|плюс|~запиши|~добавь) $AnyText::itemText

        script:
            var text = $parseTree._itemText;
            if (text && text.length > 1) {
                addItem(text, $context);
            }