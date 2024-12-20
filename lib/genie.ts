import { deburr, get, intersection, isArray, isEqual, isEqualWith, map, set, size } from 'lodash';
import generator from 'generate-password';
import { _parseBool, _parseList, _parseNumber } from './parsing';
import type { Expression, Mapping, Modifier, ScalarType } from './types';
import { mapBinaryValue } from './modifiers';

export function applyProfile(data: any, mappings: Mapping[]): any {
  let payload = {};

  for (const mapping of mappings) {
    const mapped = applyMapping(data, mapping);
    const modifier = mapping.modifier || [];
    const modified = applyModifier(mapped, modifier);
    const hasBlockModifierPassword =
      mapping.block &&
      mapping.block.findIndex(
        (b) =>
          b.modifier && b.modifier.findIndex((m) => m.name === 'password') > -1,
      ) > -1;
    const hasMappingModifierPassword =
      modifier.findIndex((m) => m.name === 'password') > -1;
    const parsed =
      hasBlockModifierPassword || hasMappingModifierPassword
        ? modified
        : autoParseValue(modified);
    const field = mapping.field;

    payload = set(payload, field, parsed);
  }

  return {
    ...data,
    payload,
  };
}

export function applyModifier(data: any, modifier: Modifier[]): any {
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
        result = `5${generator.generate(item.arguments)}`;
        break;
      case 'code':
        result = eval(`(${item.arguments.expression})`)(data);
        break;
      case 'ascii':
        result = deburr(result).replace(/[^\x00-\x7F]/g, '');
        break;
      case 'mapBinaryValue':
        result = mapBinaryValue(result, item.arguments.values);
        break;
    }
  }

  return result;
}

export function autoParseValue(value: any): ScalarType {
  if (value && String(value).toLowerCase() === 'null') {
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

  const numberVal = _parseNumber(value);

  if (numberVal !== undefined) {
    return numberVal;
  }

  if (isValidDateString(value)) {
    return value;
  }

  return value;
}

export function buildApplicationSpecificUserMap(
  genieUser: any,
  connections: any[],
): any {
  const users = get(genieUser, ['users'], []);
  const result: any = {};
  for (const user of users) {
    const userConnectionId = get(user, ['connectionId']);
    if (!userConnectionId) {
      continue;
    }
    const connection = connections.find((c) => c.id === userConnectionId);
    const revisionPayload = get(user, ['userRevision', 'payload']);
    result[connection.application] = revisionPayload;
  }
  return result;
}

export function applyMapping(data: any, mapping: Mapping): any {
  const result = [];
  const blocks = mapping.block || [];
  for (const element of blocks) {
    const blockApplication = get(element, 'application', '');
    const basePayload = get(data, 'payload');
    let payload = basePayload;
    if (blockApplication) {
      const applicationSpecificPayload = get(data, ['users', blockApplication]);
      if (applicationSpecificPayload) {
        payload = applicationSpecificPayload;
      }
    }

    let value = processElement(element, payload);
    const elementModifier = element.modifier || [];
    value = applyModifier(value, elementModifier);
    result.push(value);
  }
  const mapped = result.join('');
  const modifier = mapping.modifier || [];
  return applyModifier(mapped, modifier);
}

function processElement(element: any, payload: any): any {
  let value = '';
  let sort = element.sort || null;
  switch (element.type) {
    case 'field_reference':
      value = orderedGet(payload, String(element.content), sort);
      break;
    case 'multi_lookup_table':
      value = orderedGet(payload, String(element.content), sort);
      const multiLookupTable = element.multiLookupTable || null;
      if (multiLookupTable) {
        const rows = multiLookupTable.rows || [];
        const lookup = rows.find((row: any) => row.source === value);
        const targets = get(lookup, 'targets', []);
        if (targets) {
          const correctTarget = targets.find((target: any) => {
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
      value = orderedGet(payload, String(element.content), sort);
      const lookupTable = element.lookupTable || null;
      if (lookupTable) {
        const rows = lookupTable.row || [];
        const lookup = rows.find((row: any) => row.source === value);
        if (lookup) {
          value = lookup.target;
        }
      }
      break;
    case 'array':
      const arrayContent = get(payload, String(element.content), []);
      if (isArray(arrayContent)) {
        value = arrayContent
          .map((item) =>
            processElement(
              { ...element, type: element.secondaryType },
              { [element.content]: item },
            ),
          )
          .join(',');
      }
      break;
    default:
      value = String(element.content);
  }
  return value;
}

export function matchesExpression(data: any, expression: Expression): boolean {
  const sort = expression.sort;
  let inputValue = orderedGet(data.payload, expression.field, sort);
  let expressionValue: any = expression.value;

  if (isValidDateString(inputValue) && isValidDateString(expressionValue)) {
    inputValue = new Date(inputValue);
    expressionValue = new Date(expressionValue);
  } else {
    if (!isArray(inputValue)) {
      inputValue = autoParseValue(inputValue);
    }
    expressionValue = autoParseValue(expressionValue);
  }

  switch (expression.comparison) {
    case 'equals':
      if (isArray(inputValue) && isArray(expressionValue)) {
        const stringInput = map(inputValue, (value) => String(value));
        const stringExpression = map(expressionValue, (value) => String(value));
        const sortedInput = stringInput.sort();
        const sortedExpression = stringExpression.sort();
        return isEqual(sortedInput, sortedExpression);
      }
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
    case 'intersection':
      if (!isArray(inputValue)) {
        return false;
      }
      const intersectionValue = intersection(inputValue, expressionValue);
      return size(intersectionValue) === size(expressionValue);
  }

  return false;
}

// this is supposed to check for a field in the format of "employmentStatus.NUMBER.startDate"
// it will then sort the array of employmentStatus objects by the startDate field
export function orderedGet(data: any, path: string, sort: string | null): any {
  if (sort === undefined || !sort) {
    return get(data, path);
  }
  const sortDirection = sort === 'ascending' ? 1 : -1;
  const parts = path.split('.');
  if (parts.length === 1) {
    return get(data, path);
  }
  const actualKey = String(parts.pop());
  const containerIndex = String(parts.pop());
  if (!containerIndex.match(/\d+/)) {
    return get(data, path);
  }

  let container = get(data, parts);
  if (isArray(container)) {
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

  return get(container, [containerIndex, actualKey]);
}

function isValidDateString(dateString: string): boolean {
  try {
    const date = new Date(dateString);

    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}
