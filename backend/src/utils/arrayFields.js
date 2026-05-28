function cleanArrayItem(value) {
  const cleaned = String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/^[\s"'[{]+|[\s"'\]}]+$/g, '')
    .replace(/\\"/g, '"')
    .trim();

  if (!cleaned || cleaned === '{}' || cleaned === '[]') {
    return '';
  }

  if (/^[\[{].*[\]}]$/.test(cleaned)) {
    return '';
  }

  return cleaned;
}

function splitLooseItems(value) {
  return String(value || '')
    .split(/\r?\n|;|,/)
    .map(cleanArrayItem)
    .filter(Boolean);
}

function parsePostgresArray(text) {
  if (!text.startsWith('{')) {
    return null;
  }

  if (!text.endsWith('}')) {
    throw new Error('Malformed PostgreSQL array string.');
  }

  const inner = text.slice(1, -1);
  const items = [];
  let current = '';
  let inQuotes = false;
  let escaping = false;

  for (const char of inner) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      items.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (inQuotes) {
    throw new Error('Malformed PostgreSQL array string.');
  }

  items.push(current);
  return items.flatMap(splitLooseItems);
}

function normalizeArrayField(value) {
  if (Array.isArray(value)) {
    return value.flatMap(splitLooseItems).filter(Boolean);
  }

  if (value === null || value === undefined) {
    return [];
  }

  const text = String(value).trim();

  if (!text || text === '{}' || text === '[]') {
    return [];
  }

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.flatMap(splitLooseItems).filter(Boolean);
    }

    if (parsed && typeof parsed === 'object') {
      return [];
    }
  } catch (error) {
    // Non-JSON strings are handled below.
  }

  if (text.startsWith('{')) {
    try {
      return parsePostgresArray(text);
    } catch (error) {
      return splitLooseItems(text);
    }
  }

  return splitLooseItems(text);
}

function formatInlineList(value, separator = ', ') {
  return normalizeArrayField(value).join(separator);
}

module.exports = {
  normalizeArrayField,
  formatInlineList,
};
