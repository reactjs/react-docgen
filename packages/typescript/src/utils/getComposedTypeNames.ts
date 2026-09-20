import {
  isExportNamedDeclaration,
  isIdentifier,
  isTSInterfaceDeclaration,
  isTSTypeReference,
  type AstNode,
  type FileState,
  getBody,
} from '@react-docgen/core';

export default function getComposedTypeNames(
  file: FileState,
  annotation: AstNode | null,
): string[] {
  if (
    !annotation ||
    !isTSTypeReference(annotation) ||
    !isIdentifier(annotation.typeName)
  ) {
    return [];
  }

  const localNames = new Set(
    getBody(file).flatMap((path) => {
      const declaration =
        isExportNamedDeclaration(path.node) && path.node.declaration
          ? path.node.declaration
          : path.node;
      const id = declaration.id;

      return (isTSInterfaceDeclaration(declaration) ||
        declaration.type === 'TSTypeAliasDeclaration') &&
        id &&
        typeof id === 'object' &&
        'type' in id &&
        isIdentifier(id as AstNode)
        ? [(id as AstNode & { name: string }).name]
        : [];
    }),
  );

  for (const path of getBody(file)) {
    const declaration =
      isExportNamedDeclaration(path.node) && path.node.declaration
        ? path.node.declaration
        : path.node;

    if (
      !isTSInterfaceDeclaration(declaration) ||
      declaration.id.name !== annotation.typeName.name
    ) {
      continue;
    }
    const heritage = Array.isArray(declaration.extends)
      ? declaration.extends
      : [];

    return heritage.flatMap((item) => {
      if (!item || typeof item !== 'object' || !('expression' in item))
        return [];
      const expression = item.expression;

      return expression &&
        typeof expression === 'object' &&
        'type' in expression &&
        isIdentifier(expression as AstNode)
        ? localNames.has((expression as { name: string }).name)
          ? []
          : [(expression as { name: string }).name]
        : [];
    });
  }

  return [];
}
