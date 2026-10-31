import { parse } from 'comment-parser';
import { stringify, tryParse, type RootResult } from 'jsdoc-type-pratt-parser';
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

function typeDescriptor(type: RootResult): TypeDescriptor {
  switch (type.type) {
    case 'JsdocTypeAny':
      return { name: 'mixed' };
    case 'JsdocTypeName':
      return { name: type.value };
    case 'JsdocTypeGeneric':
      return {
        name: typeDescriptor(type.left).name,
        elements: type.elements.map(typeDescriptor),
      };
    case 'JsdocTypeTuple':
      return {
        name: 'tuple',
        elements: type.elements.map((element) =>
          element.type === 'JsdocTypeKeyValue'
            ? element.right
              ? typeDescriptor(element.right)
              : { name: element.key }
            : typeDescriptor(element),
        ),
      };
    case 'JsdocTypeUnion':
      return { name: 'union', elements: type.elements.map(typeDescriptor) };
    case 'JsdocTypeNotNullable':
    case 'JsdocTypeNullable':
    case 'JsdocTypeOptional':
    case 'JsdocTypeParenthesis':
      return typeDescriptor(type.element);
    case 'JsdocTypeVariadic':
      return type.element
        ? typeDescriptor(type.element)
        : { name: stringify(type) };
    default:
      return { name: stringify(type) };
  }
}

function parseType(raw: string): TypeDescriptor {
  const parsed = tryParse(raw, ['typescript', 'jsdoc']);

  return parsed ? typeDescriptor(parsed) : { name: raw };
}

export default function parseMethodDocblock(
  docblock: string,
): ParsedMethodDocblock {
  const source = `/**\n${docblock
    .split('\n')
    .map((line) => ` * ${line}`)
    .join('\n')}\n */`;
  const block = parse(source)[0];
  const params = new Map<string, DocblockParam>();
  let returns: ParsedMethodDocblock['returns'] = null;

  for (const tag of block?.tags ?? []) {
    if (tag.tag === 'param') {
      const name = tag.name.replace(/^\.\.\./, '');

      params.set(name, {
        name,
        optional: tag.optional || tag.type.endsWith('='),
        ...(tag.type ? { type: parseType(tag.type) } : {}),
        ...(tag.description ? { description: tag.description } : {}),
      });
    } else if ((tag.tag === 'return' || tag.tag === 'returns') && !returns) {
      const description = [tag.name, tag.description].filter(Boolean).join(' ');

      returns = {
        ...(tag.type ? { type: parseType(tag.type) } : {}),
        ...(description ? { description } : {}),
      };
    }
  }

  return { description: block?.description ?? '', params, returns };
}
