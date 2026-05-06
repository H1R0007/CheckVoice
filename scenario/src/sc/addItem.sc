theme: /

    state: ДобавлениеТовара
        q!: (~добавить|~записать|~внести|плюс|~запиши|~добавь) $AnyText::itemText

        script:
            var text = $parseTree._itemText;
            addItem(text, $context);