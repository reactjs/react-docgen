import { isIdentifier, type AstNode, type FileState } from '@react-docgen/core';
import { child, nodes, resolveType, typeName } from './ast.js';

type Parameters = Map<string, AstNode>;

function parametersFor(
  declaration: AstNode,
  reference: AstNode,
  inherited: Parameters,
): Parameters {
  const parameters = new Map(inherited);
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

    if (name && value) parameters.set(name, value);
  }

  return parameters;
}

function substitute(node: AstNode, parameters: Parameters): AstNode {
  if (node.type === 'GenericTypeAnnotation') {
    const id = child(node, 'id');

    if (id && isIdentifier(id) && parameters.has(id.name)) {
      return parameters.get(id.name) ?? node;
    }
  }

  const result: Record<string, unknown> = { ...node };

  for (const [key, value] of Object.entries(result)) {
    if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item && typeof item === 'object' && 'type' in item
          ? substitute(item as AstNode, parameters)
          : item,
      );
    } else if (value && typeof value === 'object' && 'type' in value) {
      result[key] = substitute(value as AstNode, parameters);
    }
  }

  return result as AstNode;
}

export interface PropsMembers {
  composes: string[];
  members: AstNode[];
  parameters: Parameters;
}

export default function getPropsMembers(
  file: FileState,
  annotation: AstNode | null,
  parameters: Parameters = new Map(),
  seen = new WeakSet<object>(),
): PropsMembers {
  if (!annotation) return { composes: [], members: [], parameters };

  if (annotation.type === 'ObjectTypeAnnotation') {
    const members: AstNode[] = [];
    const composes: string[] = [];

    for (const property of nodes(annotation, 'properties')) {
      if (property.type !== 'ObjectTypeSpreadProperty') {
        members.push(substitute(property, parameters));
        continue;
      }
      const spread = getPropsMembers(
        file,
        child(property, 'argument'),
        parameters,
        seen,
      );

      members.push(...spread.members);
      composes.push(...spread.composes);
    }

    return { composes, members, parameters };
  }

  if (annotation.type === 'IntersectionTypeAnnotation') {
    const results = nodes(annotation, 'types').map((type) =>
      getPropsMembers(file, type, parameters, seen),
    );

    return {
      composes: results.flatMap(({ composes }) => composes),
      members: results.flatMap(({ members }) => members),
      parameters,
    };
  }

  if (annotation.type !== 'GenericTypeAnnotation') {
    return { composes: [], members: [], parameters };
  }

  const id = child(annotation, 'id');
  const name = id ? typeName(id) : '';

  if (['$Exact', '$ReadOnly'].includes(name)) {
    const wrapped = nodes(
      child(annotation, 'typeParameters') ?? annotation,
      'params',
    )[0];

    return getPropsMembers(file, wrapped ?? null, parameters, seen);
  }

  const resolved = name ? resolveType(file, name) : null;

  if (!resolved) {
    return {
      composes: name && !name.startsWith('React') ? [name] : [],
      members: [],
      parameters,
    };
  }
  if (seen.has(resolved.declaration)) {
    return { composes: [], members: [], parameters };
  }

  seen.add(resolved.declaration);
  const nextParameters = parametersFor(
    resolved.declaration,
    annotation,
    parameters,
  );

  if (resolved.declaration.type === 'TypeAlias') {
    const result = getPropsMembers(
      resolved.file,
      child(resolved.declaration, 'right'),
      nextParameters,
      seen,
    );

    seen.delete(resolved.declaration);

    return result;
  }

  const inherited = nodes(resolved.declaration, 'extends').map((heritage) => {
    const heritageId = child(heritage, 'id');

    return getPropsMembers(
      resolved.file,
      heritageId
        ? ({
            ...heritage,
            type: 'GenericTypeAnnotation',
            id: heritageId,
          } as AstNode)
        : null,
      nextParameters,
      seen,
    );
  });
  const body = child(resolved.declaration, 'body');
  const members = [
    ...inherited.flatMap((result) => result.members),
    ...(body ? nodes(body, 'properties') : []),
  ].map((member) => substitute(member, nextParameters));
  const composes = inherited.flatMap((result) => result.composes);

  seen.delete(resolved.declaration);

  return { composes, members, parameters: nextParameters };
}
