theme: /

    state: ОчисткаЧека
        q!: (~очистить|очисти|~обнулить|обнули|~сбросить|сбрось) [~чек|~список|~покупки|~всё]

        script:
            var count = get_current_receipt_count(get_request($context));
            if (count > 0) {
                clearReceipt($context);
            } else {
                $reactions.answer("Чек и так пустой.");
            }