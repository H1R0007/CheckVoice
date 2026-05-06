theme: /

    state: «апросѕо атегории
        q!: сколько [€] (потратил|потратила|потрачено) на $AnyText::categoryText
        q!: (расходы|траты|затраты) на $AnyText::categoryText
        q!: сколько ушло на $AnyText::categoryText
        q!: сколько [было] потрачено на $AnyText::categoryText

        script:
            var text = $parseTree._categoryText;
            if (text) {
                askCategory(text, $context);
            }