"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._parseBool = _parseBool;
exports._parseInt = _parseInt;
exports._parseFloat = _parseFloat;
exports._parseNumber = _parseNumber;
exports._parseList = _parseList;
function _parseBool(value) {
    const valueLower = String(value).toLowerCase();
    if (valueLower === 'true') {
        return true;
    }
    else if (valueLower === 'false') {
        return false;
    }
    return undefined;
}
function _parseInt(val) {
    try {
        const intVal = parseInt(val, 10);
        if (!isNaN(intVal)) {
            return intVal;
        }
    }
    catch { }
    return undefined;
}
function _parseFloat(val) {
    try {
        const floatVal = parseFloat(val);
        if (!isNaN(floatVal)) {
            return floatVal;
        }
    }
    catch { }
    return undefined;
}
function _parseNumber(val) {
    const intVal = _parseInt(val);
    if (intVal !== undefined && String(intVal) === String(val)) {
        return intVal;
    }
    const floatVal = _parseFloat(val);
    if (floatVal !== undefined && String(floatVal) === String(val)) {
        return floatVal;
    }
    return undefined;
}
function _parseList(val) {
    // parse lists, in case value contains | as a part of its contents maybe || could be used?
    // or we could use a bool property passed here alongside value - isList
    let value = String(val);
    if (value.includes('|')) {
        const parts = value.split('|');
        const parsed = [];
        for (const part of parts) {
            const numVal = _parseNumber(part);
            if (numVal !== undefined) {
                parsed.push(numVal);
            }
            else {
                parsed.push(part);
            }
        }
        return parsed;
    }
    return undefined;
}
