theme: /

    state: ОчисткаЧека
        q!: (~очистить|очисти|~обнулить|обнули|~сбросить|сбрось) [~чек|~список|~всё]
        q!: удали всё [из чека]

        script:
            var count = get_current_receipt_count(get_request($context));
            clearReceipt($context);