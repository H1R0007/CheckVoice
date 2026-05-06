theme: /

    state: —охранение„ека
        q!: (~сохранить|сохрани|~закрыть|закрой) [~чек|~список|~покупки]
        q!: (~завершить|заверши|~закончить|закончи) [~чек|~покупки|~ввод]
        q!: [~чек] (~готов|~готово|~всЄ)

        script:
            var count = get_current_receipt_count(get_request($context));
            var total = get_current_receipt_total(get_request($context));

            if (count > 0) {
                saveReceipt($context);
            }