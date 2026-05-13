function get_request(context) {
    if (context && context.request)
        return context.request.rawRequest;
    return {};
}

function get_server_action(request) {
    if (request &&
        request.payload &&
        request.payload.data &&
        request.payload.data.server_action) {
        return request.payload.data.server_action;
    }
    return {};
}

function get_screen(request) {
    if (request &&
        request.payload &&
        request.payload.meta &&
        request.payload.meta.current_app &&
        request.payload.meta.current_app.state) {
        return request.payload.meta.current_app.state.screen;
    }
    return "";
}

function get_selected_item(request) {
    if (request &&
        request.payload &&
        request.payload.selected_item) {
        return request.payload.selected_item;
    }
    return null;
}

function get_items(request) {
    if (request &&
        request.payload &&
        request.payload.meta &&
        request.payload.meta.current_app &&
        request.payload.meta.current_app.state &&
        request.payload.meta.current_app.state.item_selector) {
        return request.payload.meta.current_app.state.item_selector.items;
    }
    return null;
}

function get_id_by_selected_item(request) {
    var items = get_items(request);
    var selected_item = get_selected_item(request);
    if (selected_item && items) {
        if (items[selected_item.index]) {
            return items[selected_item.index].id;
        }
    }
    return null;
}

function get_current_receipt_total(request) {
    if (request &&
        request.payload &&
        request.payload.meta &&
        request.payload.meta.current_app &&
        request.payload.meta.current_app.state) {
        return request.payload.meta.current_app.state.current_receipt_total;
    }
    return 0;
}

function get_current_receipt_count(request) {
    if (request &&
        request.payload &&
        request.payload.meta &&
        request.payload.meta.current_app &&
        request.payload.meta.current_app.state) {
        return request.payload.meta.current_app.state.current_receipt_count;
    }
    return 0;
}

// Универсальная функция чтения параметров из sendData события
function get_event_params(context) {
    try {
        var raw = context && context.request ? context.request.rawRequest : null;
        var payload = raw && raw.payload ? raw.payload : null;

        // Основной путь для assistant.sendData({ action: { action_id, parameters } })
        if (payload && payload.action && payload.action.parameters) {
            return payload.action.parameters;
        }
        if (payload && payload.parameters) {
            return payload.parameters;
        }
        if (payload && payload.data && payload.data.parameters) {
            return payload.data.parameters;
        }
        if (payload && payload.data && payload.data.server_action && payload.data.server_action.parameters) {
            return payload.data.server_action.parameters;
        }
    } catch (e) {}

    try {
        if (context && context.request && context.request.data) {
            if (context.request.data.parameters) return context.request.data.parameters;
            if (context.request.data.eventData) return context.request.data.eventData;
            return context.request.data;
        }
    } catch (e2) {}

    return {};
}

// Склонение числительных
function pluralize(count, one, few, many) {
    var mod10 = count % 10;
    var mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
}

// Форматирование суммы: 89.5 → "89 рублей 50 копеек", 100 → "100 рублей"
function formatMoney(amount) {
    if (typeof amount !== "number") amount = parseFloat(amount) || 0;
    var rounded = Math.round(amount * 100);
    var rubles = Math.floor(rounded / 100);
    var kopecks = rounded % 100;

    var rubWord = pluralize(rubles, "рубль", "рубля", "рублей");
    var result = rubles + " " + rubWord;

    if (kopecks > 0) {
        var kopWord = pluralize(kopecks, "копейка", "копейки", "копеек");
        result += " " + kopecks + " " + kopWord;
    }

    return result;
}

// Форматирование количества позиций
function formatCount(count) {
    return count + " " + pluralize(count, "позиция", "позиции", "позиций");
}

// Форматирование количества чеков
function formatReceipts(count) {
    return count + " " + pluralize(count, "чек", "чека", "чеков");
}

// Форматирование количества покупок
function formatPurchases(count) {
    return count + " " + pluralize(count, "покупка", "покупки", "покупок");
}