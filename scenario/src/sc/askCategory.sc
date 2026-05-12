theme: /

    # =============================================
    # Запросы по СТАТИСТИКЕ (данные из истории)
    # =============================================

    state: СтатистикаПоКатегорииЗаНеделю
        q!: сколько [я] (потратил|потратила|потрачено|ушло|израсходовано) за неделю на $AnyText::categoryText
        q!: (расходы|траты|затраты) за неделю на $AnyText::categoryText
        q!: сколько ушло за неделю на $AnyText::categoryText
        q!: за неделю на $AnyText::categoryText [сколько|что]

        script:
            var text = $parseTree._categoryText;
            if (text) {
                addAction({ type: "ask_category", categoryText: text, period: "week" }, $context);
            } else {
                $reactions.answer("Уточните категорию, например: сколько потрачено на мясо за неделю.");
            }

    state: СтатистикаПоКатегорииЗаМесяц
        q!: сколько [я] (потратил|потратила|потрачено|ушло|израсходовано) за месяц на $AnyText::categoryText
        q!: (расходы|траты|затраты) за месяц на $AnyText::categoryText
        q!: сколько ушло за месяц на $AnyText::categoryText
        q!: за месяц на $AnyText::categoryText [сколько|что]

        script:
            var text = $parseTree._categoryText;
            if (text) {
                addAction({ type: "ask_category", categoryText: text, period: "month" }, $context);
            } else {
                $reactions.answer("Уточните категорию, например: сколько потрачено на мясо за месяц.");
            }

    state: СтатистикаОбщаяЗаНеделю
        q!: сколько [я] (потратил|потратила|потрачено|ушло) за неделю [~всего|~итого]
        q!: (расходы|траты|затраты) за неделю [~всего|~итого]
        q!: общая сумма за неделю
        q!: итого за неделю

        script:
            addAction({ type: "ask_period_total", period: "week" }, $context);

    state: СтатистикаОбщаяЗаМесяц
        q!: сколько [я] (потратил|потратила|потрачено|ушло) за месяц [~всего|~итого]
        q!: (расходы|траты|затраты) за месяц [~всего|~итого]
        q!: общая сумма за месяц
        q!: итого за месяц

        script:
            addAction({ type: "ask_period_total", period: "month" }, $context);

    state: СтатистикаОбщаяЗаВсёВремя
        q!: сколько [я] (потратил|потратила|потрачено|ушло) [за всё время|~вообще|~суммарно]
        q!: (расходы|траты|затраты) [за всё время|~вообще]
        q!: общая сумма [за всё время]
        q!: всего потрачено

        script:
            addAction({ type: "ask_period_total", period: "all" }, $context);

    state: СтатистикаПоКатегории
        q!: сколько [я] (потратил|потратила|потрачено|ушло) [~всего] на $AnyText::categoryText
        q!: (расходы|траты|затраты) на $AnyText::categoryText
        q!: сколько [было] потрачено на $AnyText::categoryText
        q!: на $AnyText::categoryText (потрачено|ушло|израсходовано) [сколько]

        script:
            var text = $parseTree._categoryText;
            if (text) {
                addAction({ type: "ask_category", categoryText: text, period: "all" }, $context);
            } else {
                $reactions.answer("Уточните категорию, например: сколько потрачено на хлеб.");
            }