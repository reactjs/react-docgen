import {
  isIdentifier,
  isExportNamedDeclaration,
  isTSInterfaceDeclaration,
  isTSTypeAliasDeclaration,
  isTSTypeLiteral,
  isTSTypeReference,
  type AstNode,
  type FileState,
  getBody,
  getValueFile,
  resolveValue,
} from '@react-docgen/core';

function child(node: AstNode, key: string): AstNode | null {
  const value = node[key];

  return value && typeof value === 'object' && 'type' in value
    ? (value as AstNode)
    : null;
}

function nodes(node: AstNode, key: string): AstNode[] {
  const value = node[key];

  return Array.isArray(value)
    ? value.filter((item): item is AstNode =>
        Boolean(item && typeof item === 'object' && 'type' in item),
      )
    : [];
}

function substitute(node: AstNode, parameters: Map<string, AstNode>): AstNode {
  if (isIdentifier(node) && parameters.has(node.name)) {
    const value = parameters.get(node.name);

    return value && isTSTypeReference(value) ? value.typeName : (value ?? node);
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

function parametersFor(
  declaration: AstNode,
  reference: AstNode,
): Map<string, AstNode> {
  const declared = child(declaration, 'typeParameters');
  const provided =
    child(reference, 'typeArguments') ?? child(reference, 'typeParameters');
  const values = provided ? nodes(provided, 'params') : [];

  return new Map(
    (declared ? nodes(declared, 'params') : []).flatMap((parameter, index) => {
      const name = child(parameter, 'name') ?? parameter;
      const value = values[index];

      return isIdentifier(name) && value ? [[name.name, value]] : [];
    }),
  );
}

export default function getPropsMembers(
  file: FileState,
  annotation: AstNode | null,
  seen = new WeakSet<object>(),
): AstNode[] {
  if (!annotation) return [];
  if (isTSTypeLiteral(annotation)) return annotation.members;

  if (annotation.type === 'TSIntersectionType') {
    return nodes(annotation, 'types').flatMap((type) =>
      getPropsMembers(file, type),
    );
  }

  if (!isTSTypeReference(annotation)) return [];
  const typeName = annotation.typeName;

  if (!isIdentifier(typeName)) {
    const wrapperName = Array.isArray(typeName.range)
      ? file.source.code.slice(typeName.range[0], typeName.range[1])
      : '';

    if (
      /^(?:React\.)?Props(?:WithChildren|WithRef|WithoutRef)$/.test(wrapperName)
    ) {
      const argumentsNode =
        child(annotation, 'typeArguments') ??
        child(annotation, 'typeParameters');
      const [wrapped] = argumentsNode ? nodes(argumentsNode, 'params') : [];

      return getPropsMembers(file, wrapped ?? null);
    }

    return [];
  }

  const importedDeclaration = resolveValue(file, typeName);

  if (importedDeclaration !== typeName) {
    const importedFile = getValueFile(file, importedDeclaration);

    if (isTSTypeAliasDeclaration(importedDeclaration)) {
      if (seen.has(importedDeclaration)) return [];
      seen.add(importedDeclaration);
      const members = getPropsMembers(
        importedFile,
        importedDeclaration.typeAnnotation,
        seen,
      );

      seen.delete(importedDeclaration);

      return members;
    }
    if (isTSInterfaceDeclaration(importedDeclaration)) {
      if (seen.has(importedDeclaration)) return [];
      seen.add(importedDeclaration);
      const inherited = nodes(importedDeclaration, 'extends').flatMap(
        (heritage) => {
          const expression = child(heritage, 'expression');

          if (!expression) return [];

          return getPropsMembers(
            importedFile,
            {
              ...heritage,
              type: 'TSTypeReference',
              typeName: expression,
            } as AstNode,
            seen,
          );
        },
      );

      seen.delete(importedDeclaration);

      return [...inherited, ...importedDeclaration.body.body];
    }
  }

  for (const path of getBody(file)) {
    const declaration =
      isExportNamedDeclaration(path.node) && path.node.declaration
        ? path.node.declaration
        : path.node;

    if (
      isTSTypeAliasDeclaration(declaration) &&
      declaration.id.name === typeName.name
    ) {
      if (seen.has(declaration)) return [];
      seen.add(declaration);
      const members = getPropsMembers(
        file,
        declaration.typeAnnotation,
        seen,
      ).map((member) =>
        substitute(member, parametersFor(declaration, annotation)),
      );

      seen.delete(declaration);

      return members;
    }

    if (
      isTSInterfaceDeclaration(declaration) &&
      declaration.id.name === typeName.name
    ) {
      if (seen.has(declaration)) return [];
      seen.add(declaration);
      const parameters = parametersFor(declaration, annotation);
      const inherited = nodes(declaration, 'extends').flatMap((heritage) => {
        const expression = child(heritage, 'expression');

        if (!expression) return [];
        const reference = {
          ...heritage,
          type: 'TSTypeReference',
          typeName: expression,
        } as AstNode;

        return getPropsMembers(file, reference, seen);
      });

      const members = [...inherited, ...declaration.body.body].map((member) =>
        substitute(member, parameters),
      );

      seen.delete(declaration);

      return members;
    }
  }

  return [];
}
