import { deburr, get, set } from 'lodash';
import generator from 'generate-password';
import { _parseBool, _parseList, _parseNumber } from './parsing';
import type { Expression, Mapping, Modifier, ScalarType } from './types';

export function applyProfile(data: any, mappings: Mapping[]): any {
  let payload = {};

  for (const mapping of mappings) {
    const mapped = applyMapping(data, mapping);
    const modifier = mapping.modifier || [];
    const modified = applyModifier(mapped, modifier);
    const parsed = modifier.findIndex(m => m.name === 'password') > -1 ? modified : autoParseValue(modified);
    const field = mapping.field;

    payload = set(payload, field, parsed);
  }

  data.payload = payload;

  return data;
}

export function applyModifier(data: any, modifier: Modifier[]): any {
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
      case 'password':
        result = generator.generate(item.arguments);
        break;
      case 'ascii':
        result = deburr(result).replace(/[^\x00-\x7F]/g, '');
    }
  }

  return result;
}

export function autoParseValue(value: string): ScalarType {
  if (value && value.toLowerCase() === 'null') {
    return null;
  }

  const boolVal = _parseBool(value);

  if (boolVal !== undefined) {
    return boolVal;
  }

  const listVal = _parseList(value);

  if (listVal !== undefined) {
    return listVal;
  }

  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return value;
  }

  const numberVal = _parseNumber(value);

  if (numberVal !== undefined) {
    return numberVal;
  }

  return value;
}

export function applyMapping(data: any, mapping: Mapping): any {
  const result = [];
  const blocks = mapping.block || [];
  for (const element of blocks) {
    let value = '';
    const elementModifier = element.modifier || [];
    switch (element.type) {
      case 'field_reference':
        value = get(data.payload, String(element.content));
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

export function matchesExpression(data: any, expression: Expression): boolean {
  let inputValue = get(data.payload, expression.field);
  let expressionValue: any = expression.value;

  if (isValidDateString(inputValue) && isValidDateString(expressionValue)) {
    inputValue = new Date(inputValue);
    expressionValue = new Date(expressionValue);
  } else {
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

function isValidDateString(dateString: string): boolean {
  try {
    const date = new Date(dateString);

    return !isNaN(date.getTime());
  }
  catch {
    return false;
  }
}
