"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyProfile = applyProfile;
exports.applyModifier = applyModifier;
exports.autoParseValue = autoParseValue;
exports.applyMapping = applyMapping;
exports.matchesExpression = matchesExpression;
exports.orderedGet = orderedGet;
const lodash_1 = require("lodash");
const generate_password_1 = __importDefault(require("generate-password"));
const parsing_1 = require("./parsing");
function applyProfile(data, mappings) {
    let payload = {};
    for (const mapping of mappings) {
        const mapped = applyMapping(data, mapping);
        const modifier = mapping.modifier || [];
        const modified = applyModifier(mapped, modifier);
        const hasBlockModifierPassword = mapping.block && mapping.block.findIndex(b => b.modifier && b.modifier.findIndex(m => m.name === 'password') > -1) > -1;
        const hasMappingModifierPassword = modifier.findIndex(m => m.name === 'password') > -1;
        const parsed = hasBlockModifierPassword || hasMappingModifierPassword ? modified : autoParseValue(modified);
        const field = mapping.field;
        payload = (0, lodash_1.set)(payload, field, parsed);
    }
    return {
        ...data,
        payload,
    };
}
function applyModifier(data, modifier) {
    if (!modifier.length) {
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
            case 'password':
                result = `5${generate_password_1.default.generate(item.arguments)}`;
                break;
            case 'code':
                result = eval(`(${item.arguments.expression})`)(data);
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
    const boolVal = (0, parsing_1._parseBool)(value);
    if (boolVal !== undefined) {
        return boolVal;
    }
    const listVal = (0, parsing_1._parseList)(value);
    if (listVal !== undefined) {
        return listVal;
    }
    const numberVal = (0, parsing_1._parseNumber)(value);
    if (numberVal !== undefined) {
        return numberVal;
    }
    if (isValidDateString(value)) {
        return value;
    }
    return value;
}
function applyMapping(data, mapping) {
    const result = [];
    const blocks = mapping.block || [];
    for (const element of blocks) {
        let value = '';
        const elementModifier = element.modifier || [];
        let sort = element.sort || null;
        switch (element.type) {
            case 'field_reference':
                value = orderedGet(data.payload, String(element.content), sort);
                break;
            case 'multi_lookup_table':
                value = orderedGet(data.payload, String(element.content), sort);
                const multiLookupTable = element.multiLookupTable || null;
                if (multiLookupTable) {
                    const rows = multiLookupTable.rows || [];
                    const lookup = rows.find((row) => row.source === value);
                    const targets = (0, lodash_1.get)(lookup, 'targets', []);
                    if (targets) {
                        const correctTarget = targets.find((target) => {
                            const targetPieces = target.target.split(' = ');
                            const targetField = targetPieces[0];
                            return targetField === element.multiLookupTableColumn;
                        });
                        if (correctTarget) {
                            value = correctTarget.value;
                        }
                    }
                }
                break;
            case 'lookup_table':
                value = orderedGet(data.payload, String(element.content), sort);
                const lookupTable = element.lookupTable || null;
                if (lookupTable) {
                    const rows = lookupTable.row || [];
                    const lookup = rows.find((row) => row.source === value);
                    if (lookup) {
                        value = lookup.target;
                    }
                }
                break;
            default:
                value = String(element.content);
        }
        value = applyModifier(value, elementModifier);
        result.push(value);
    }
    const mapped = result.join('');
    const modifier = mapping.modifier || [];
    return applyModifier(mapped, modifier);
}
function matchesExpression(data, expression) {
    const sort = expression.sort;
    let inputValue = orderedGet(data.payload, expression.field, sort);
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
        case 'contains':
            if (!(0, lodash_1.isArray)(inputValue)) {
                return false;
            }
            const intersectionValue = (0, lodash_1.intersection)(inputValue, expressionValue);
            return (0, lodash_1.size)(intersectionValue) === (0, lodash_1.size)(expressionValue);
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
// this is supposed to check for a field in the format of "employmentStatus.NUMBER.startDate"
// it will then sort the array of employmentStatus objects by the startDate field
function orderedGet(data, path, sort) {
    if (sort === undefined || !sort) {
        return (0, lodash_1.get)(data, path);
    }
    const sortDirection = sort === 'ascending' ? 1 : -1;
    const parts = path.split('.');
    if (parts.length === 1) {
        return (0, lodash_1.get)(data, path);
    }
    const actualKey = String(parts.pop());
    const containerIndex = String(parts.pop());
    if (!containerIndex.match(/\d+/)) {
        return (0, lodash_1.get)(data, path);
    }
    let container = (0, lodash_1.get)(data, parts);
    if ((0, lodash_1.isArray)(container)) {
        container.sort((a, b) => {
            let first = autoParseValue(a[actualKey]);
            let last = autoParseValue(b[actualKey]);
            if (first === null || last === null) {
                return 0;
            }
            if (first > last) {
                return 1 * sortDirection;
            }
            if (first < last) {
                return -1 * sortDirection;
            }
            return 0;
        });
    }
    return (0, lodash_1.get)(container, [containerIndex, actualKey]);
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
