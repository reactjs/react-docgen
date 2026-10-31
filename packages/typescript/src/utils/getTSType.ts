import {
  isIdentifier,
  isTSPropertySignature,
  isTSTypeAliasDeclaration,
  isTSTypeAnnotation,
  isTSTypeReference,
  type AstNode,
  type FileState,
  type TypeDescriptor,
  getBody,
  getDescription,
  getPropertyName,
} from '@react-docgen/core';

function source(file: FileState, node: AstNode): string {
  const value = Array.isArray(node.range)
    ? file.source.code.slice(node.range[0], node.range[1])
    : '';

  if (!value.includes('\n')) return value;
  const lines = value.split('\n');
  const closingIndent = /^(\s*)/.exec(lines.at(-1) ?? '')?.[1]?.length ?? 0;

  return lines
    .map((line, index) =>
      index === 0 ? line : line.slice(Math.min(closingIndent, line.length)),
    )
    .join('\n');
}

function nodes(node: AstNode, key: string): AstNode[] {
  const value = node[key];

  return Array.isArray(value)
    ? value.filter((item): item is AstNode =>
        Boolean(item && typeof item === 'object' && 'type' in item),
      )
    : [];
}

function child(node: AstNode, key: string): AstNode | null {
  const value = node[key];

  return value && typeof value === 'object' && 'type' in value
    ? (value as AstNode)
    : null;
}

function typeName(file: FileState, node: AstNode): string {
  return isIdentifier(node)
    ? node.name
    : source(file, node).replaceAll('.', '');
}

function replaceTypeParameter(
  node: AstNode,
  name: string,
  value: AstNode,
): AstNode {
  if (isIdentifier(node, { name })) {
    return isTSTypeReference(value) ? value.typeName : value;
  }
  const result: Record<string, unknown> = { ...node };

  for (const [key, item] of Object.entries(result)) {
    if (Array.isArray(item)) {
      result[key] = item.map((entry) =>
        entry && typeof entry === 'object' && 'type' in entry
          ? replaceTypeParameter(entry as AstNode, name, value)
          : entry,
      );
    } else if (item && typeof item === 'object' && 'type' in item) {
      result[key] = replaceTypeParameter(item as AstNode, name, value);
    }
  }

  return result as AstNode;
}

function objectType(
  file: FileState,
  node: AstNode,
  resolving: Set<string>,
): TypeDescriptor {
  const properties = nodes(node, 'members').flatMap((member) => {
    if (!isTSPropertySignature(member)) return [];
    const key = getPropertyName(member.key);
    const annotation = member.typeAnnotation
      ? getTSType(file, member.typeAnnotation, resolving)
      : null;
    const description = getDescription(file, member);

    return key && annotation
      ? [
          {
            key,
            value: { ...annotation, required: !member.optional },
            ...(description ? { description } : {}),
          },
        ]
      : [];
  });

  return {
    name: 'signature',
    type: 'object',
    raw: source(file, node),
    signature: { properties },
  };
}

function functionType(file: FileState, node: AstNode): TypeDescriptor {
  const parameters = nodes(node, 'params');
  const returnType = child(node, 'returnType');

  return {
    name: 'signature',
    type: 'function',
    raw: source(file, node),
    signature: {
      arguments: parameters.flatMap((parameter) => {
        const annotation = child(parameter, 'typeAnnotation');
        const nameNode =
          parameter.type === 'RestElement'
            ? child(parameter, 'argument')
            : parameter;
        const name =
          nameNode && isIdentifier(nameNode)
            ? nameNode.name
            : source(file, nameNode ?? parameter);

        return annotation
          ? [
              {
                type: getTSType(file, annotation),
                name,
                ...(parameter.type === 'RestElement' ? { rest: true } : {}),
                ...(parameter.optional ? { optional: true } : {}),
              },
            ]
          : [];
      }),
      return: returnType ? getTSType(file, returnType) : { name: 'void' },
    },
  };
}

export default function getTSType(
  file: FileState,
  input: AstNode | undefined,
  resolving = new Set<string>(),
): TypeDescriptor | null {
  if (!input) return null;
  const node = isTSTypeAnnotation(input) ? input.typeAnnotation : input;
  const keywords: Record<string, string> = {
    TSAnyKeyword: 'any',
    TSBooleanKeyword: 'boolean',
    TSNeverKeyword: 'never',
    TSNullKeyword: 'null',
    TSNumberKeyword: 'number',
    TSObjectKeyword: 'object',
    TSStringKeyword: 'string',
    TSSymbolKeyword: 'symbol',
    TSUndefinedKeyword: 'undefined',
    TSUnknownKeyword: 'unknown',
    TSVoidKeyword: 'void',
  };
  const keyword = keywords[node.type];

  if (keyword) return { name: keyword };

  if (node.type === 'TSLiteralType') {
    const literal = child(node, 'literal');

    return literal ? { name: 'literal', value: source(file, literal) } : null;
  }

  if (node.type === 'TSUnionType' || node.type === 'TSIntersectionType') {
    return {
      name: node.type === 'TSUnionType' ? 'union' : 'intersection',
      raw: source(file, node),
      elements: nodes(node, 'types').flatMap((item) => {
        const type = getTSType(file, item);

        return type ? [type] : [];
      }),
    };
  }

  if (node.type === 'TSArrayType') {
    const element = child(node, 'elementType');

    return {
      name: 'Array',
      elements: element ? [getTSType(file, element)].filter(Boolean) : [],
      raw: source(file, node),
    };
  }

  if (node.type === 'TSTupleType') {
    return {
      name: 'tuple',
      raw: source(file, node),
      elements: nodes(node, 'elementTypes').flatMap((item) => {
        const type = getTSType(file, item);

        return type ? [type] : [];
      }),
    };
  }

  if (node.type === 'TSFunctionType') return functionType(file, node);
  if (node.type === 'TSTypeLiteral') return objectType(file, node, resolving);

  if (node.type === 'TSTypeReference') {
    const nameNode = child(node, 'typeName');

    if (!nameNode) return null;
    const name = typeName(file, nameNode);

    for (const statement of getBody(file)) {
      if (
        isTSTypeAliasDeclaration(statement.node) &&
        statement.node.id.name === name &&
        !resolving.has(name) &&
        (statement.node.typeAnnotation.type === 'TSTupleType' ||
          statement.node.typeAnnotation.type === 'TSUnionType' ||
          statement.node.typeAnnotation.type === 'TSIntersectionType' ||
          statement.node.typeAnnotation.type === 'TSTypeLiteral' ||
          statement.node.typeAnnotation.type === 'TSArrayType' ||
          statement.node.typeAnnotation.type === 'TSTypeReference')
      ) {
        resolving.add(name);
        let annotation = statement.node.typeAnnotation;
        const declared = child(statement.node, 'typeParameters');
        const provided =
          child(node, 'typeArguments') ?? child(node, 'typeParameters');
        const [parameter] = declared ? nodes(declared, 'params') : [];
        const [argument] = provided ? nodes(provided, 'params') : [];
        const parameterName = parameter
          ? (child(parameter, 'name') ?? parameter)
          : null;

        if (parameterName && isIdentifier(parameterName) && argument) {
          annotation = replaceTypeParameter(
            annotation,
            parameterName.name,
            argument,
          );
        }
        const result = getTSType(file, annotation, resolving);

        resolving.delete(name);

        return result;
      }
    }

    const typeArguments =
      child(node, 'typeArguments') ?? child(node, 'typeParameters');
    const elements = typeArguments
      ? nodes(typeArguments, 'params').flatMap((item) => {
          const type = getTSType(file, item);

          return type ? [type] : [];
        })
      : [];

    return {
      name,
      ...(source(file, node) !== name &&
      (source(file, node).includes('<') || source(file, node).includes('.'))
        ? { raw: source(file, node) }
        : {}),
      ...(elements.length ? { elements } : {}),
    };
  }

  if (node.type === 'TSTypeQuery') {
    const expression = child(node, 'exprName');

    return { name: expression ? source(file, expression) : source(file, node) };
  }

  if (node.type === 'TSIndexedAccessType') {
    const raw = source(file, node);
    const object = child(node, 'objectType');
    const index = child(node, 'indexType');
    const name =
      index?.type === 'TSTypeOperator'
        ? `${object ? source(file, object).replace(/^./, (value) => value.toLowerCase()) : ''}[${getTSType(file, index, resolving)?.name ?? ''}]`
        : raw.replace(/^typeof\s+/, '');

    return { name, raw };
  }

  if (node.type === 'TSTypeOperator') {
    const annotation = child(node, 'typeAnnotation');

    if (node.operator === 'keyof' && annotation?.type === 'TSTypeLiteral') {
      return {
        name: 'union',
        raw: source(file, node),
        elements: nodes(annotation, 'members').flatMap((member) => {
          if (!isTSPropertySignature(member)) return [];
          const key = getPropertyName(member.key);

          return key ? [{ name: 'literal', value: key }] : [];
        }),
      };
    }
    const raw = annotation ? source(file, annotation) : source(file, node);

    return { name: raw.replace(/^./, (value) => value.toLowerCase()) };
  }

  if (node.type === 'TSMappedType') {
    const typeParameter = child(node, 'typeParameter');
    const constraint =
      child(node, 'constraint') ??
      (typeParameter ? child(typeParameter, 'constraint') : null);
    const annotation = child(node, 'typeAnnotation');
    const keyType = constraint ? getTSType(file, constraint, resolving) : null;
    const resolvedValue = annotation
      ? getTSType(file, annotation, resolving)
      : null;
    const valueType = resolvedValue
      ? {
          ...resolvedValue,
          name: resolvedValue.name.replace(/^./, (value) =>
            value.toLowerCase(),
          ),
        }
      : null;

    return {
      name: 'signature',
      type: 'object',
      raw: source(file, node),
      signature: {
        properties:
          keyType && valueType
            ? [
                {
                  key: {
                    name: keyType.name,
                    required: !node.optional,
                  },
                  value: valueType,
                },
              ]
            : [],
      },
    };
  }

  return { name: source(file, node) || node.type };
}
