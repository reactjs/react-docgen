import {
  isAssignmentExpression,
  isExportDefaultDeclaration,
  isExportNamedDeclaration,
  isExpressionStatement,
  isIdentifier,
  isLiteral,
  isMemberExpression,
  isObjectExpression,
  isProperty,
  isVariableDeclaration,
  isVariableDeclarator,
  type AstNode,
  type FileState,
} from '../internal.js';
import getBody from './getBody.js';
import getPropertyName from './getPropertyName.js';

const valueFiles = new WeakMap<AstNode, FileState>();

function markTree(file: FileState, node: AstNode): void {
  valueFiles.set(node, file);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === 'object' && 'type' in child) {
          markTree(file, child as AstNode);
        }
      }
    } else if (value && typeof value === 'object' && 'type' in value) {
      markTree(file, value as AstNode);
    }
  }
}

function nodes(node: AstNode, key: string): AstNode[] {
  const value = node[key];

  return Array.isArray(value)
    ? value.filter((item): item is AstNode =>
        Boolean(item && typeof item === 'object' && 'type' in item),
      )
    : [];
}

function importSource(node: AstNode): string | null {
  const source = node.source;

  return source &&
    typeof source === 'object' &&
    'type' in source &&
    isLiteral(source as AstNode) &&
    typeof (source as AstNode & { value: unknown }).value === 'string'
    ? String((source as AstNode & { value: unknown }).value)
    : null;
}

function importedBinding(
  file: FileState,
  localName: string,
): { file: FileState; importedName: string } | null {
  for (const path of getBody(file)) {
    if (path.node.type !== 'ImportDeclaration') continue;
    const source = importSource(path.node);

    if (!source || (!source.startsWith('.') && !source.startsWith('/')))
      continue;
    for (const specifier of nodes(path.node, 'specifiers')) {
      const local = specifier.local;

      if (
        !local ||
        typeof local !== 'object' ||
        !('type' in local) ||
        !isIdentifier(local as AstNode, { name: localName })
      )
        continue;
      const imported = specifier.imported;
      const importedName =
        specifier.type === 'ImportDefaultSpecifier'
          ? 'default'
          : specifier.type === 'ImportNamespaceSpecifier'
            ? '*'
            : imported &&
                typeof imported === 'object' &&
                'type' in imported &&
                isIdentifier(imported as AstNode)
              ? (imported as AstNode & { name: string }).name
              : localName;

      try {
        return { file: file.import(source), importedName };
      } catch {
        return null;
      }
    }
  }

  return null;
}

function localValue(file: FileState, name: string): AstNode | null {
  for (const path of getBody(file)) {
    const declaration =
      isExportNamedDeclaration(path.node) && path.node.declaration
        ? path.node.declaration
        : path.node;

    if (isVariableDeclaration(declaration)) {
      for (const variable of declaration.declarations) {
        if (
          isVariableDeclarator(variable) &&
          isIdentifier(variable.id, { name }) &&
          variable.init
        )
          return variable.init;
        if (
          isVariableDeclarator(variable) &&
          variable.id.type === 'ObjectPattern' &&
          variable.init
        ) {
          for (const property of nodes(variable.id, 'properties')) {
            if (
              !isProperty(property) ||
              !isIdentifier(property.value, { name })
            )
              continue;
            const object = resolveValue(file, variable.init);

            if (!isObjectExpression(object)) continue;
            const value = object.properties.find(
              (item) =>
                isProperty(item) &&
                getPropertyName(item.key) === getPropertyName(property.key),
            );

            if (value && isProperty(value)) return value.value;
          }
        }
      }
    }
    if (
      (declaration.type === 'FunctionDeclaration' ||
        declaration.type === 'ClassDeclaration') &&
      declaration.id &&
      typeof declaration.id === 'object' &&
      'type' in declaration.id &&
      isIdentifier(declaration.id as AstNode, { name })
    )
      return declaration;
    if (
      !isExpressionStatement(path.node) ||
      !isAssignmentExpression(path.node.expression)
    )
      continue;
    if (isIdentifier(path.node.expression.left, { name }))
      return path.node.expression.right;
  }

  return null;
}

function memberValue(
  file: FileState,
  objectName: string,
  name: string,
): AstNode | null {
  for (const path of getBody(file)) {
    if (
      !isExpressionStatement(path.node) ||
      !isAssignmentExpression(path.node.expression)
    )
      continue;
    const left = path.node.expression.left;

    if (
      isMemberExpression(left) &&
      isIdentifier(left.object, { name: objectName }) &&
      getPropertyName(left.property) === name
    )
      return path.node.expression.right;
  }

  return null;
}

function exportedValue(
  file: FileState,
  name: string,
  seen: Set<string>,
): AstNode | null {
  const key = `${file.source.filename}:${name}`;

  if (seen.has(key)) return null;
  seen.add(key);

  for (const path of getBody(file)) {
    if (isExportDefaultDeclaration(path.node) && name === 'default') {
      return resolve(file, path.node.declaration, seen);
    }
    if (path.node.type === 'ExportAllDeclaration') {
      const source = importSource(path.node);

      if (source) {
        const value = exportedValue(file.import(source), name, seen);

        if (value) return value;
      }
    }
    if (!isExportNamedDeclaration(path.node)) continue;
    if (path.node.declaration) {
      const declaration = path.node.declaration;

      if (isVariableDeclaration(declaration)) {
        for (const variable of declaration.declarations) {
          if (
            isVariableDeclarator(variable) &&
            isIdentifier(variable.id, { name }) &&
            variable.init
          ) {
            return resolve(file, variable.init, seen);
          }
          if (
            isVariableDeclarator(variable) &&
            variable.id.type === 'ObjectPattern'
          ) {
            const value = localValue(file, name);

            if (value) return resolve(file, value, seen);
          }
        }
      }
      if (
        declaration.id &&
        typeof declaration.id === 'object' &&
        'type' in declaration.id &&
        isIdentifier(declaration.id as AstNode, { name })
      ) {
        return declaration;
      }
    }
    for (const specifier of nodes(path.node, 'specifiers')) {
      const exported = specifier.exported;

      if (
        !exported ||
        typeof exported !== 'object' ||
        !('type' in exported) ||
        !isIdentifier(exported as AstNode, { name })
      )
        continue;
      const local = specifier.local;
      const localName =
        local &&
        typeof local === 'object' &&
        'type' in local &&
        isIdentifier(local as AstNode)
          ? (local as AstNode & { name: string }).name
          : name;
      const source = importSource(path.node);

      return source
        ? exportedValue(file.import(source), localName, seen)
        : resolve(
            file,
            { type: 'Identifier', name: localName } as AstNode,
            seen,
          );
    }
  }

  return null;
}

function exportedMember(
  file: FileState,
  exportName: string,
  memberName: string,
  seen: Set<string>,
): AstNode | null {
  const key = `${file.source.filename}:${exportName}.${memberName}`;

  if (seen.has(key)) return null;
  seen.add(key);
  for (const path of getBody(file)) {
    if (path.node.type === 'ExportAllDeclaration') {
      const source = importSource(path.node);

      if (source) {
        const value = exportedMember(
          file.import(source),
          exportName,
          memberName,
          seen,
        );

        if (value) return value;
      }
    }
    if (!isExportNamedDeclaration(path.node)) continue;
    for (const specifier of nodes(path.node, 'specifiers')) {
      const exported = specifier.exported;

      if (
        !exported ||
        typeof exported !== 'object' ||
        !('type' in exported) ||
        !isIdentifier(exported as AstNode, { name: exportName })
      )
        continue;
      const local = specifier.local;
      const localName =
        local &&
        typeof local === 'object' &&
        'type' in local &&
        isIdentifier(local as AstNode)
          ? (local as AstNode & { name: string }).name
          : exportName;
      const source = importSource(path.node);

      if (source)
        return exportedMember(file.import(source), localName, memberName, seen);
      const value = memberValue(file, localName, memberName);

      if (value) return resolve(file, value, seen);
    }
  }
  const value = memberValue(file, exportName, memberName);

  if (value) return resolve(file, value, seen);
  const exported = exportedValue(file, exportName, seen);

  if (exported && isObjectExpression(exported)) {
    const property = exported.properties.find(
      (item) => isProperty(item) && getPropertyName(item.key) === memberName,
    );

    if (property && isProperty(property))
      return resolve(file, property.value, seen);
  }

  return null;
}

function resolve(file: FileState, node: AstNode, seen: Set<string>): AstNode {
  markTree(file, node);
  if (isIdentifier(node)) {
    const imported = importedBinding(file, node.name);

    if (imported)
      return exportedValue(imported.file, imported.importedName, seen) ?? node;
    const value = localValue(file, node.name);

    return value ? resolve(file, value, seen) : node;
  }
  if (
    isMemberExpression(node) &&
    !node.computed &&
    isIdentifier(node.property)
  ) {
    if (isIdentifier(node.object)) {
      const imported = importedBinding(file, node.object.name);

      if (imported) {
        if (imported.importedName === '*') {
          return exportedValue(imported.file, node.property.name, seen) ?? node;
        }
        const localName =
          imported.importedName === 'default'
            ? (() => {
                for (const path of getBody(imported.file)) {
                  if (
                    isExportDefaultDeclaration(path.node) &&
                    isIdentifier(path.node.declaration)
                  )
                    return path.node.declaration.name;
                }

                return imported.importedName;
              })()
            : imported.importedName;
        const value = exportedMember(
          imported.file,
          imported.importedName === 'default'
            ? localName
            : imported.importedName,
          node.property.name,
          seen,
        );

        return value ? resolve(imported.file, value, seen) : node;
      }
      const value = memberValue(file, node.object.name, node.property.name);

      if (value) return resolve(file, value, seen);
    }
    const object = resolve(file, node.object, seen);

    if (isObjectExpression(object)) {
      const property = object.properties.find(
        (item) =>
          isProperty(item) && getPropertyName(item.key) === node.property.name,
      );

      if (property && isProperty(property))
        return resolve(file, property.value, seen);
    }
  }

  return node;
}

export default function resolveValue(file: FileState, node: AstNode): AstNode {
  return resolve(file, node, new Set());
}

export function getValueFile(fallback: FileState, node: AstNode): FileState {
  return valueFiles.get(node) ?? fallback;
}
