export function normalizeArrayField(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (value === null || value === undefined) {
    return [];
  }

  const text = String(value).trim();

  if (!text || text === '{}' || text === '[]') {
    return [];
  }

  if (text.startsWith('{') && text.endsWith('}')) {
    return text
      .slice(1, -1)
      .split(',')
      .map((item) => item.replace(/^"|"$/g, '').trim())
      .filter(Boolean);
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Keep parsing simple and predictable for non-JSON database strings.
  }

  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function arrayFieldToInput(value, separator = ', ') {
  return normalizeArrayField(value).join(separator);
}
