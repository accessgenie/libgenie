import { boolean } from 'boolean';
import { deburr, get } from 'lodash';

export type Mapping = {
  id: number;

  name: string;

  field: string;

  dataType: string;

  block?: Block[];

  modifier?: Modifier[];
};

export type Block = {
  id: number;

  type: string;

  content?: string;

  modifier?: Modifier[];
};

export type Expression = {
  id: number;

  field: string;

  comparison: string;

  value: string;

  name: string;

  dataType: string;
};

export type Modifier = {
  id: number;

  name: string;

  arguments?: any;
};

export function applyProfile(data: any, mappings: Mapping[]): any {
  let payload = {};
  for (const mapping of mappings) {
    const mapped = applyMapping(data, mapping);

    const modifier = mapping.modifier || [];
    const modified = applyModifier(mapped, modifier);
    const casted = applyCast(modified, mapping.dataType);
    const field = mapping.field || '';
    payload = { ...payload, [field]: casted };
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

export function applyCast(data: any, dataType: string): any {
  switch (dataType) {
    case 'string':
      return String(data);
    case 'number':
      return Number(data);
    case 'boolean':
      return boolean(data);
    case 'liststring':
      return data.split('|');
    case 'listnumber':
      return data.split('|').map(Number);
  }
  return data;
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
  let inputValue: any = get(data.payload, expression.field);
  let expressionValue: any = expression.value;
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
