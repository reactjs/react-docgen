import type { NodePath } from '@babel/traverse';
import printValue from './printValue';

/**
 * If node is an Identifier, it returns its name. If it is a literal, it returns
 * its value.
 */
export default function getNameOrValue(
  path: NodePath,
): boolean | number | string | null {
  if (path.isIdentifier()) {
    return path.node.name;
  } else if (path.isQualifiedTypeIdentifier() || path.isTSQualifiedName()) {
    return printValue(path);
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

  throw new TypeError(
    `Argument must be Identifier, Literal, QualifiedTypeIdentifier or TSQualifiedName. Received '${path.node.type}'`,
  );
}
