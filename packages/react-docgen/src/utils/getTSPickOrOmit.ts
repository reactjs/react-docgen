import type { NodePath } from '@babel/traverse';
import getTypeArguments from './getTypeArguments.js';
import getTypeIdentifier from './getTypeIdentifier.js';
import resolveToValue from './resolveToValue.js';

/**
 * Returns the literal keys of a `Pick` or `Omit` key argument, such as `'a'` or
 * `'a' | 'b'`. Returns null when any key is not a string or number literal.
 */
function getLiteralKeys(path: NodePath): Set<string> | null {
  if (path.isTSLiteralType()) {
    const literal = path.get('literal');

    if (literal.isStringLiteral() || literal.isNumericLiteral()) {
      return new Set([`${literal.node.value}`]);
    }

    return null;
  }

  if (path.isTSUnionType()) {
    const keys = new Set<string>();

    for (const typePath of path.get('types')) {
      const typeKeys = getLiteralKeys(typePath);

      if (!typeKeys) return null;
      typeKeys.forEach((key) => keys.add(key));
    }

    return keys;
  }

  return null;
}

/**
 * Detects the builtin TypeScript `Pick<T, K>` and `Omit<T, K>` utility types
 * when `K` is made of string or number literals. Types named `Pick` or `Omit` that are
 * declared or imported locally are not matched.
 */
export default function getTSPickOrOmit(
  path: NodePath,
): { name: 'Omit' | 'Pick'; source: NodePath; keys: Set<string> } | null {
  if (
    !path.isTSTypeReference() &&
    !['TSExpressionWithTypeArguments', 'TSInterfaceHeritage'].includes(
      path.node.type,
    )
  ) {
    return null;
  }

  const typeName = getTypeIdentifier(path);

  if (!typeName || !typeName.isIdentifier()) return null;

  const name = typeName.node.name;

  if (
    (name !== 'Pick' && name !== 'Omit') ||
    resolveToValue(typeName) !== typeName
  ) {
    return null;
  }

  const typeArguments = getTypeArguments(path);

  if (!typeArguments.hasNode()) return null;

  const [source, keysPath] = typeArguments.get('params') as NodePath[];

  if (!source || !keysPath) return null;

  const keys = getLiteralKeys(keysPath);

  return keys ? { name, source, keys } : null;
}
