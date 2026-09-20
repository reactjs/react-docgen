import type { TypeDescriptor } from '../internal.js';

export interface DocblockParam {
  description?: string;
  name: string;
  optional: boolean;
  type?: TypeDescriptor;
}

export interface ParsedMethodDocblock {
  description: string;
  params: Map<string, DocblockParam>;
  returns: { description?: string; type?: TypeDescriptor } | null;
}

function parseType(raw: string): TypeDescriptor {
  const value = raw.replace(/=$/, '');

  if (value === '*') return { name: 'mixed' };
  if (value.startsWith('[') && value.endsWith(']')) {
    return {
      name: 'tuple',
      elements: value
        .slice(1, -1)
        .split(',')
        .map((part) => parseType(part.trim())),
    };
  }
  if (value.includes('|')) {
    return { name: 'union', elements: value.split('|').map(parseType) };
  }
  if (value.endsWith('[]')) {
    return { name: 'Array', elements: [parseType(value.slice(0, -2))] };
  }

  return { name: value };
}

export default function parseMethodDocblock(
  docblock: string,
): ParsedMethodDocblock {
  const params = new Map<string, DocblockParam>();
  let returns: ParsedMethodDocblock['returns'] = null;
  const description: string[] = [];

  for (const line of docblock.split('\n')) {
    const trimmed = line.trim();
    const param = /^@param\s+\{([^}]+)\}\s+(\S+)(?:\s+(.*))?$/.exec(trimmed);

    if (param) {
      const [, rawType = '', rawName = '', text] = param;
      const name = rawName.replace(/^\.\.\./, '').replace(/^\[|\]$/g, '');

      params.set(name, {
        name,
        optional: rawType.endsWith('=') || /^\[/.test(rawName),
        type: parseType(rawType),
        ...(text ? { description: text } : {}),
      });
      continue;
    }
    const returned = /^@returns?\s*(?:\{([^}]+)\})?\s*(.*)$/.exec(trimmed);

    if (returned && !returns) {
      const [, rawType, text] = returned;

      returns = {
        ...(rawType ? { type: parseType(rawType) } : {}),
        ...(text ? { description: text } : {}),
      };
      continue;
    }
    if (!trimmed.startsWith('@') && (description.length > 0 || trimmed)) {
      description.push(trimmed);
    }
  }

  return { description: description.join('\n').trim(), params, returns };
}
