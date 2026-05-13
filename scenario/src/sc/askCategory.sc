theme: /

    state: СтатистикаПоКатегорииЗаНеделю
        q!: сколько [я] (потратил|потратила|потрачено) за неделю на $AnyText::categoryText
        q!: (расходы|траты) за неделю на $AnyText::categoryText

        script:
            var text = $parseTree._categoryText;
            if (text) {
                askCategory(text, "week", $context);
            } else {
                $reactions.answer("Уточните категорию.");
            }

    state: СтатистикаПоКатегорииЗаМесяц
        q!: сколько [я] (потратил|потратила|потрачено) за месяц на $AnyText::categoryText
        q!: (расходы|траты) за месяц на $AnyText::categoryText

        script:
            var text = $parseTree._categoryText;
            if (text) {
                askCategory(text, "month", $context);
            } else {
                $reactions.answer("Уточните категорию.");
            }

    state: СтатистикаОбщаяЗаНеделю
        q!: сколько [я] (потратил|потратила|потрачено) за неделю [~всего|~итого]
        q!: (расходы|траты) за неделю
        q!: общая сумма за неделю

        script:
            askPeriodTotal("week", $context);

    state: СтатистикаОбщаяЗаМесяц
        q!: сколько [я] (потратил|потратила|потрачено) за месяц [~всего|~итого]
        q!: (расходы|траты) за месяц
        q!: общая сумма за месяц

        script:
            askPeriodTotal("month", $context);

    state: СтатистикаОбщаяЗаВсёВремя
        q!: сколько [я] (потратил|потратила|потрачено) [за всё время|~вообще]
        q!: (расходы|траты) [за всё время]
        q!: всего потрачено

        script:
            askPeriodTotal("all", $context);

    state: СтатистикаПоКатегории
        q!: сколько [я] (потратил|потратила|потрачено) на $AnyText::categoryText
        q!: (расходы|траты) на $AnyText::categoryText

        script:
            var text = $parseTree._categoryText;
            if (text) {
                askCategory(text, "all", $context);
            } else {
                $reactions.answer("Уточните категорию.");
            }