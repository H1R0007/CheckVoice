function addItem(text, context) {
    addAction({
        type: "add_item",
        text: text
    }, context);
}

function deleteItem(id, context) {
    addAction({
        type: "delete_item",
        id: id
    }, context);
}

function clearReceipt(context) {
    addAction({
        type: "clear_receipt"
    }, context);
}

function saveReceipt(context) {
    addAction({
        type: "save_receipt"
    }, context);
}

function navigateTo(screen, context) {
    addAction({
        type: "navigate",
        screen: screen
    }, context);
}

function askTotal(context) {
    addAction({
        type: "ask_total"
    }, context);
}

function askCategory(categoryText, context) {
    addAction({
        type: "ask_category",
        categoryText: categoryText
    }, context);
}

function editPrice(id, newPrice, context) {
    addAction({
        type: "edit_price",
        id: id,
        newPrice: newPrice
    }, context);
}

function deleteAllReceipts(context) {
    addAction({
        type: "delete_all_receipts"
    }, context);
}

function editPriceByName(text, context) {
    addAction({
        type: "edit_price_by_name",
        text: text
    }, context);
}

// ===== НОВЫЕ ФУНКЦИИ =====

function askPeriodTotal(period, context) {
    addAction({
        type: "ask_period_total",
        period: period
    }, context);
}

function askItemPrice(itemName, context) {
    addAction({
        type: "ask_item_price",
        itemName: itemName
    }, context);
}