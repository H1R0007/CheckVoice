theme: /

    state: СохранениеЧека
        q!: (~сохранить|сохрани|~закрыть|закрой) [~чек|~список]
        q!: (~завершить|заверши|~закончить|закончи) [~чек|~покупки]
        q!: [~чек] (~готов|~готово|~всё)

        script:
            var count = get_current_receipt_count(get_request($context));
            if (count > 0) {
                saveReceipt($context);
            } else {
                $reactions.answer("Чек пустой, нечего сохранять.");
            }