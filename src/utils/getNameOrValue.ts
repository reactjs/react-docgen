import type { NodePath } from '@babel/traverse';

/**
 * If node is an Identifier, it returns its name. If it is a literal, it returns
 * its value.
 */
export default function getNameOrValue(
  path: NodePath,
): boolean | number | string | null {
  if (path.isIdentifier()) {
    return path.node.name;
  } else if (
    path.isStringLiteral() ||
    path.isNumericLiteral() ||
    path.isBooleanLiteral()
  ) {
    return path.node.value;
  } else if (path.isRegExpLiteral()) {
    return path.node.pattern;
  } else if (path.isNullLiteral()) {
    return null;
  }

  throw new TypeError('Argument must be an Identifier or a Literal');
}
