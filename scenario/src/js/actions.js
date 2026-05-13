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

function askCategory(categoryText, period, context) {
    addAction({
        type: "ask_category",
        categoryText: categoryText,
        period: period
    }, context);
}

function editPrice(id, newPrice, context) {
    addAction({
        type: "edit_price",
        id: id,
        newPrice: newPrice
    }, context);
}

function editPriceByName(text, context) {
    addAction({
        type: "edit_price_by_name",
        text: text
    }, context);
}

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

function readReceipt(context) {
    addAction({
        type: "read_receipt"
    }, context);
}

function cancelPending(context) {
    addAction({
        type: "cancel_pending"
    }, context);
}

function undoLastItem(context) {
    addAction({
        type: "undo_last_item"
    }, context);
}

function showHelp(context) {
    addAction({
        type: "show_help"
    }, context);
}

function openLastReceipt(context) {
    addAction({
        type: "open_last_receipt"
    }, context);
}

function editLastReceipt(context) {
    addAction({
        type: "edit_last_receipt"
    }, context);
}

function deleteLastReceipt(context) {
    addAction({
        type: "delete_last_receipt"
    }, context);
}

function exportData(context) {
    addAction({
        type: "export_data"
    }, context);
}