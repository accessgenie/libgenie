export function mapBinaryValue(input: string, values: string[]): string {
  const normalizedInput = input?.trim().toLowerCase();

  if (normalizedInput === 'y' || normalizedInput === 'yes' || normalizedInput === '1' || normalizedInput === 'true') {
    return values[0];
  }
  if (normalizedInput === 'n' || normalizedInput === 'no' || normalizedInput === '0' || normalizedInput === 'false') {
    return values[1];
  }

  return normalizedInput ? values[0] : values[1];
}

export function capitalize(input: string): string {
  return input
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
