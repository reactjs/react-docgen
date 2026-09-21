import {
  getDescription,
  isIdentifier,
  type AstNode,
  type FileState,
  type TypeDescriptor,
  resolveValue,
} from '@react-docgen/core';
import { child, nodes, raw, resolveType, typeName } from './ast.js';

type Parameters = Map<string, AstNode>;

const primitiveTypes: Record<string, string> = {
  AnyTypeAnnotation: 'any',
  BooleanTypeAnnotation: 'boolean',
  EmptyTypeAnnotation: 'empty',
  MixedTypeAnnotation: 'mixed',
  NullLiteralTypeAnnotation: 'null',
  NumberTypeAnnotation: 'number',
  StringTypeAnnotation: 'string',
  VoidTypeAnnotation: 'void',
};

function literal(file: FileState, node: AstNode): TypeDescriptor {
  return {
    name: 'literal',
    value: raw(file, node),
  };
}

function withRequired(type: TypeDescriptor, node: AstNode): TypeDescriptor {
  return { ...type, required: node.optional !== true };
}

function parametersFor(
  declaration: AstNode,
  reference: AstNode,
  inherited: Parameters,
): Parameters {
  const result = new Map(inherited);
  const declared = child(declaration, 'typeParameters');
  const provided = child(reference, 'typeParameters');
  const values = provided ? nodes(provided, 'params') : [];

  for (const [index, parameter] of (declared
    ? nodes(declared, 'params')
    : []
  ).entries()) {
    const value = values[index];

    const name = isIdentifier(parameter)
      ? parameter.name
      : typeof parameter.name === 'string'
        ? parameter.name
        : null;

    if (name && value) result.set(name, value);
  }

  return result;
}

function objectType(
  file: FileState,
  node: AstNode,
  parameters: Parameters,
  seen: WeakSet<object>,
): TypeDescriptor {
  const properties: Array<Record<string, unknown>> = [];

  for (const indexer of nodes(node, 'indexers')) {
    const key = child(indexer, 'key');
    const value = child(indexer, 'value');

    if (key && value) {
      properties.push({
        key: resolve(file, key, parameters, seen),
        value: withRequired(resolve(file, value, parameters, seen), indexer),
        ...(getDescription(file, indexer)
          ? { description: getDescription(file, indexer) }
          : {}),
      });
    }
  }

  for (const property of nodes(node, 'properties')) {
    if (property.type === 'ObjectTypeSpreadProperty') {
      const argument = child(property, 'argument');
      const spread = argument
        ? resolve(file, argument, parameters, seen)
        : null;

      if (
        spread &&
        spread.signature &&
        typeof spread.signature === 'object' &&
        'properties' in spread.signature &&
        Array.isArray(spread.signature.properties)
      ) {
        properties.push(...spread.signature.properties);
      }
      continue;
    }
    if (property.type !== 'ObjectTypeProperty') continue;
    const key = child(property, 'key');
    const value = child(property, 'value');

    if (!key || !value) continue;
    properties.push({
      key: isIdentifier(key) ? key.name : String(key.value ?? ''),
      value: withRequired(resolve(file, value, parameters, seen), property),
      ...(getDescription(file, property)
        ? { description: getDescription(file, property) }
        : {}),
    });
  }

  const descriptor: TypeDescriptor = {
    name: 'signature',
    type: 'object',
    raw: raw(file, node),
    signature: { properties },
  };
  const callProperty = nodes(node, 'callProperties')[0];
  const callValue = callProperty ? child(callProperty, 'value') : null;

  if (callValue) {
    (descriptor.signature as Record<string, unknown>)['constructor'] = resolve(
      file,
      callValue,
      parameters,
      seen,
    );
  }

  return descriptor;
}

function genericType(
  file: FileState,
  node: AstNode,
  parameters: Parameters,
  seen: WeakSet<object>,
): TypeDescriptor {
  const id = child(node, 'id');
  const name = id ? typeName(id) : 'unknown';
  const parameter = parameters.get(name);

  if (parameter) {
    const parameterId = child(parameter, 'id');

    return parameter.type === 'GenericTypeAnnotation' &&
      parameterId &&
      typeName(parameterId) === name
      ? { name }
      : resolve(file, parameter, parameters, seen);
  }

  const resolved = name ? resolveType(file, name) : null;

  if (resolved?.declaration.type === 'TypeAlias') {
    if (seen.has(resolved.declaration)) {
      const [first] = nodes(child(node, 'typeParameters') ?? node, 'params');
      const firstId =
        first?.type === 'GenericTypeAnnotation' ? child(first, 'id') : null;

      return firstId
        ? { name: typeName(firstId) }
        : first
          ? resolve(file, first, new Map(), seen)
          : { name };
    }
    seen.add(resolved.declaration);
    const type = resolve(
      resolved.file,
      child(resolved.declaration, 'right') ?? node,
      parametersFor(resolved.declaration, node, parameters),
      seen,
    );

    seen.delete(resolved.declaration);

    return type;
  }

  const params = nodes(child(node, 'typeParameters') ?? node, 'params');

  if (name === '$Keys' && params[0]?.type === 'TypeofTypeAnnotation') {
    const argument = child(params[0], 'argument');
    const typeId =
      argument?.type === 'GenericTypeAnnotation'
        ? child(argument, 'id')
        : argument;
    const object = typeId ? resolveValue(file, typeId) : null;
    const keys =
      object?.type === 'ObjectExpression'
        ? nodes(object, 'properties').flatMap((property) => {
            const key = child(property, 'key');

            return key && isIdentifier(key) ? [key.name] : [];
          })
        : [];

    if (keys.length > 0) {
      return {
        name: 'union',
        raw: raw(file, node),
        elements: keys.map((value) => ({ name: 'literal', value })),
      };
    }
  }

  return {
    name,
    ...(id?.type === 'QualifiedTypeIdentifier' ? { raw: raw(file, id) } : {}),
    ...(params.length > 0
      ? {
          elements: params.map((item) => resolve(file, item, parameters, seen)),
          raw: raw(file, node),
        }
      : {}),
  };
}

function resolve(
  file: FileState,
  node: AstNode,
  parameters: Parameters,
  seen: WeakSet<object>,
): TypeDescriptor {
  if (node.type === 'TypeAnnotation') {
    const annotation = child(node, 'typeAnnotation');

    return annotation
      ? resolve(file, annotation, parameters, seen)
      : { name: 'unknown' };
  }
  const primitive = primitiveTypes[node.type];

  if (primitive) return { name: primitive };
  if (
    node.type === 'BooleanLiteralTypeAnnotation' ||
    node.type === 'NumberLiteralTypeAnnotation' ||
    node.type === 'StringLiteralTypeAnnotation' ||
    node.type === 'BigIntLiteralTypeAnnotation'
  ) {
    return literal(file, node);
  }

  if (node.type === 'GenericTypeAnnotation') {
    return genericType(file, node, parameters, seen);
  }
  if (node.type === 'ArrayTypeAnnotation') {
    const element = child(node, 'elementType');

    return {
      name: 'Array',
      elements: element ? [resolve(file, element, parameters, seen)] : [],
      raw: raw(file, node),
    };
  }
  if (
    node.type === 'UnionTypeAnnotation' ||
    node.type === 'IntersectionTypeAnnotation'
  ) {
    return {
      name: node.type === 'UnionTypeAnnotation' ? 'union' : 'intersection',
      raw: raw(file, node),
      elements: nodes(node, 'types').map((item) =>
        resolve(file, item, parameters, seen),
      ),
    };
  }
  if (node.type === 'TupleTypeAnnotation') {
    return {
      name: 'tuple',
      raw: raw(file, node),
      elements: nodes(node, 'types').map((item) =>
        resolve(file, item, parameters, seen),
      ),
    };
  }
  if (node.type === 'NullableTypeAnnotation') {
    const annotation = child(node, 'typeAnnotation');

    return {
      ...(annotation
        ? resolve(file, annotation, parameters, seen)
        : { name: 'unknown' }),
      nullable: true,
    };
  }
  if (node.type === 'ObjectTypeAnnotation') {
    return objectType(file, node, parameters, seen);
  }
  if (node.type === 'FunctionTypeAnnotation') {
    const returnType = child(node, 'returnType');
    const args: Array<Record<string, unknown>> = nodes(node, 'params').map(
      (parameter) => {
        const name = child(parameter, 'name');
        const annotation = child(parameter, 'typeAnnotation');

        return {
          name: name && isIdentifier(name) ? name.name : '',
          ...(annotation
            ? { type: resolve(file, annotation, parameters, seen) }
            : {}),
        };
      },
    );
    const rest = child(node, 'rest');

    if (rest) {
      const name = child(rest, 'name');
      const annotation = child(rest, 'typeAnnotation');

      args.push({
        name: name && isIdentifier(name) ? name.name : '',
        ...(annotation
          ? { type: resolve(file, annotation, parameters, seen) }
          : {}),
        rest: true,
      });
    }

    return {
      name: 'signature',
      type: 'function',
      raw: raw(file, node),
      signature: {
        arguments: args,
        return: returnType
          ? resolve(file, returnType, parameters, seen)
          : { name: 'unknown' },
      },
    };
  }
  if (node.type === 'TypeofTypeAnnotation') {
    const argument = child(node, 'argument');

    if (argument && isIdentifier(argument)) return { name: argument.name };

    return argument
      ? resolve(file, argument, parameters, seen)
      : { name: 'unknown' };
  }
  if (node.type === 'IndexedAccessType') {
    const object = child(node, 'objectType');
    const index = child(node, 'indexType');
    const objectDescriptor = object
      ? resolve(file, object, parameters, seen)
      : { name: 'unknown' };
    const indexType = index
      ? resolve(file, index, parameters, seen)
      : { name: 'unknown' };
    const properties =
      objectDescriptor.signature &&
      typeof objectDescriptor.signature === 'object' &&
      'properties' in objectDescriptor.signature &&
      Array.isArray(objectDescriptor.signature.properties)
        ? objectDescriptor.signature.properties
        : [];
    const key =
      typeof indexType.value === 'string'
        ? indexType.value.replace(/['"]/g, '')
        : indexType.name;
    const property = properties.find(
      (item) => item && typeof item === 'object' && item.key === key,
    ) as { value?: TypeDescriptor } | undefined;

    return property?.value
      ? { name: property.value.name, raw: raw(file, node) }
      : { name: 'unknown' };
  }

  return { name: 'unknown' };
}

export default function getFlowType(
  file: FileState,
  annotation: AstNode | null | undefined,
  parameters: Parameters = new Map(),
): TypeDescriptor | null {
  return annotation
    ? resolve(file, annotation, parameters, new WeakSet<object>())
    : null;
}
