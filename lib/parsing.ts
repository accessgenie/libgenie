export function _parseBool(value: string): boolean | undefined {
  const valueLower = value.toLowerCase();

  if (valueLower === 'true') {
    return true;
  } else if (valueLower === 'false') {
    return false;
  }

  return undefined;
}

export function _parseInt(val: string): number | undefined {
  try {
    const intVal = parseInt(val, 10);

    if (!isNaN(intVal)) {
      return intVal;
    }
  }
  catch {}

  return undefined;
}

export function _parseFloat(val: string): number | undefined {
  try {
    const floatVal = parseFloat(val);

    if (!isNaN(floatVal)) {
      return floatVal;
    }
  }
  catch {}

  return undefined;
}

export function _parseNumber(val: string): number | undefined {
  const intVal = _parseInt(val);

  if (intVal !== undefined) {
    return intVal;
  }

  const floatVal = _parseFloat(val);

  if (floatVal !== undefined) {
    return floatVal;
  }

  return undefined;
}

export function _parseList(val: string): (string | number)[] | undefined {
  // parse lists, in case value contains | as a part of its contents maybe || could be used?
  // or we could use a bool property passed here alongside value - isList
  if (val.includes('|')) {
    const parts = val.split('|')
    const parsed = [];

    for (const part of parts) {
      const numVal = _parseNumber(part);

      if (numVal !== undefined) {
        parsed.push(numVal);
      } else {
        parsed.push(part);
      }
    }

    return parsed;
  }

  return undefined;
}
