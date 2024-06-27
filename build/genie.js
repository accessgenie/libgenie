"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyProfile = applyProfile;
exports.applyModifier = applyModifier;
exports.applyCast = applyCast;
exports.applyMapping = applyMapping;
exports.matchesExpression = matchesExpression;
const boolean_1 = require("boolean");
const lodash_1 = require("lodash");
function applyProfile(data, mappings) {
    let payload = {};
    for (const mapping of mappings) {
        const mapped = applyMapping(data, mapping);
        const modifier = mapping.modifier || [];
        const modified = applyModifier(mapped, modifier);
        const casted = applyCast(modified, mapping.dataType);
        const field = mapping.field;
        payload = (0, lodash_1.set)(payload, field, casted);
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
function applyCast(data, dataType) {
    switch (dataType) {
        case 'string':
            return String(data);
        case 'number':
            return Number(data);
        case 'boolean':
            return (0, boolean_1.boolean)(data);
        case 'liststring':
            return data.split('|');
        case 'listnumber':
            return data.split('|').map(Number);
    }
    return data;
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
    switch (expression.dataType) {
        case 'string':
            inputValue = applyCast(inputValue, 'string');
            expressionValue = applyCast(expressionValue, 'string');
            break;
        case 'number':
            inputValue = applyCast(inputValue, 'number');
            expressionValue = applyCast(expressionValue, 'number');
            break;
        case 'boolean':
            inputValue = applyCast(inputValue, 'boolean');
            expressionValue = applyCast(expressionValue, 'boolean');
            break;
        case 'date':
            inputValue = new Date(inputValue).getTime();
            expressionValue = new Date(expressionValue).getTime();
            break;
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
