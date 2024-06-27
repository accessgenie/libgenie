import { deburr, get, set } from 'lodash';
import type { Expression, Mapping, Modifier, ScalarType } from './types';

export function applyProfile(data: any, mappings: Mapping[]): any {
  let payload = {};

  for (const mapping of mappings) {
    const mapped = applyMapping(data, mapping);
    const modifier = mapping.modifier || [];
    const modified = applyModifier(mapped, modifier);
    const parsed = autoParseValue(modified);
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

  function parseBool(): boolean {
    const valueLower = value.toLowerCase();

    if (valueLower === 'true') {
      return true;
    } else if (valueLower === 'false') {
      return false;
    } else {
      throw new Error('Invalid boolean value');
    }
  }

  try {
    return parseBool();
  } catch (e) {
  }

  try {
    return parseInt(value, 10);
  } catch (e) {
  }

  try {
    return parseFloat(value);
  } catch (e) {
  }

  // parse lists, in case value contains | as a part of its contents maybe || could be used?
  // or we could use a bool property passed here alongside value - isList
  if (value.includes('|')) {
    const parts = value.split('|')
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

export function applyMapping(data: any, mapping: Mapping): any {
  const result = [];
  const blocks = mapping.block || [];
  for (const element of blocks) {
    let value = '';
    switch (element.type) {
      case 'field_reference':
        value = get(data.payload, String(element.content));
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
