"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyProfile = applyProfile;
exports.applyModifier = applyModifier;
exports.autoParseValue = autoParseValue;
exports.applyMapping = applyMapping;
exports.matchesExpression = matchesExpression;
const lodash_1 = require("lodash");
function applyProfile(data, mappings) {
    let payload = {};
    for (const mapping of mappings) {
        const mapped = applyMapping(data, mapping);
        const modifier = mapping.modifier || [];
        const modified = applyModifier(mapped, modifier);
        const parsed = autoParseValue(modified);
        const field = mapping.field;
        payload = (0, lodash_1.set)(payload, field, parsed);
    }
    data.payload = payload;
    return data;
}
function applyModifier(data, modifier) {
    if (!modifier) {
        return data;
    }
    let result = String(data);
    for (const item of modifier) {
        switch (item.name) {
            case 'trim':
                result = result.trim();
                break;
            case 'slice':
                const { start, end } = item.arguments;
                result = result.slice(start, end);
                break;
            case 'uppercase':
                result = result.toUpperCase();
                break;
            case 'lowercase':
                result = result.toLowerCase();
                break;
            case 'ascii':
                result = (0, lodash_1.deburr)(result).replace(/[^\x00-\x7F]/g, '');
        }
    }
    return result;
}
function autoParseValue(value) {
    if (value && value.toLowerCase() === 'null') {
        return null;
    }
    function parseBool() {
        const valueLower = value.toLowerCase();
        if (valueLower === 'true') {
            return true;
        }
        else if (valueLower === 'false') {
            return false;
        }
        else {
            throw new Error('Invalid boolean value');
        }
    }
    try {
        return parseBool();
    }
    catch (e) {
    }
    try {
        return parseInt(value, 10);
    }
    catch (e) {
    }
    try {
        return parseFloat(value);
    }
    catch (e) {
    }
    // parse lists, in case value contains | as a part of its contents maybe || could be used?
    // or we could use a bool property passed here alongside value - isList
    if (value.includes('|')) {
        const parts = value.split('|');
        const parsed = [];
        for (const part of parts) {
            try {
                parsed.push(Number(part));
            }
            catch {
                parsed.push(part);
            }
        }
        return parsed;
    }
    return value;
}
function applyMapping(data, mapping) {
    const result = [];
    const blocks = mapping.block || [];
    for (const element of blocks) {
        let value = '';
        switch (element.type) {
            case 'field_reference':
                value = (0, lodash_1.get)(data.payload, String(element.content));
                break;
            default:
                value = String(element.content);
        }
        result.push(value);
    }
    const mapped = result.join('');
    const modifier = mapping.modifier || [];
    return applyModifier(mapped, modifier);
}
function matchesExpression(data, expression) {
    let inputValue = (0, lodash_1.get)(data.payload, expression.field);
    let expressionValue = expression.value;
    if (isValidDateString(inputValue) && isValidDateString(expressionValue)) {
        inputValue = new Date(inputValue);
        expressionValue = new Date(expressionValue);
    }
    else {
        inputValue = autoParseValue(inputValue);
        expressionValue = autoParseValue(expressionValue);
    }
    switch (expression.comparison) {
        case 'equals':
            return inputValue === expressionValue;
        case 'does_not_equal':
            return inputValue !== expressionValue;
        case 'greater_than':
            return inputValue > expressionValue;
        case 'less_than':
            return inputValue < expressionValue;
        case 'greater_than_or_equal':
            return inputValue >= expressionValue;
        case 'less_than_or_equal':
            return inputValue <= expressionValue;
        case 'regex':
            return new RegExp(expressionValue).test(inputValue);
    }
    return false;
}
function isValidDateString(dateString) {
    try {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }
    catch {
        return false;
    }
}
