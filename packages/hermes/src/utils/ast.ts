import {
  isExportNamedDeclaration,
  isIdentifier,
  isLiteral,
  type AstNode,
  type FileState,
  getBody,
} from '@react-docgen/core';

export function child(node: AstNode, key: string): AstNode | null {
  const value = node[key];

  return value && typeof value === 'object' && 'type' in value
    ? (value as AstNode)
    : null;
}

export function nodes(node: AstNode, key: string): AstNode[] {
  const value = node[key];

  return Array.isArray(value)
    ? value.filter((item): item is AstNode =>
        Boolean(item && typeof item === 'object' && 'type' in item),
      )
    : [];
}

function source(node: AstNode): string | null {
  const value = child(node, 'source');

  return value && isLiteral(value) && typeof value.value === 'string'
    ? value.value
    : null;
}

export function resolveType(
  file: FileState,
  name: string,
  seen = new Set<string>(),
): { declaration: AstNode; file: FileState } | null {
  const key = `${file.source.filename}:${name}`;

  if (seen.has(key)) return null;
  seen.add(key);

  for (const path of getBody(file)) {
    const declaration =
      isExportNamedDeclaration(path.node) && path.node.declaration
        ? path.node.declaration
        : path.node;
    const id = child(declaration, 'id');

    if (
      (declaration.type === 'TypeAlias' ||
        declaration.type === 'InterfaceDeclaration') &&
      id &&
      isIdentifier(id, { name })
    ) {
      return { declaration, file };
    }

    if (path.node.type === 'ImportDeclaration') {
      for (const specifier of nodes(path.node, 'specifiers')) {
        const local = child(specifier, 'local');

        if (!local || !isIdentifier(local, { name })) continue;
        const imported = child(specifier, 'imported');
        const importedName =
          specifier.type === 'ImportDefaultSpecifier'
            ? 'default'
            : imported && isIdentifier(imported)
              ? imported.name
              : name;
        const specifierSource = source(path.node);

        if (!specifierSource) return null;

        try {
          return resolveType(file.import(specifierSource), importedName, seen);
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

export function raw(file: FileState, node: AstNode): string {
  return Array.isArray(node.range)
    ? file.source.code.slice(node.range[0], node.range[1])
    : '';
}

export function typeName(node: AstNode): string {
  if (isIdentifier(node)) return node.name;
  if (node.type === 'QualifiedTypeIdentifier') {
    const qualification = child(node, 'qualification');
    const id = child(node, 'id');

    return `${qualification ? typeName(qualification) : ''}${
      id && isIdentifier(id) ? id.name : ''
    }`;
  }

  return '';
}
