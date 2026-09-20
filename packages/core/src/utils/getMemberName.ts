import { isIdentifier, isMemberExpression, type AstNode } from '../internal.js';

export default function getMemberName(node: AstNode): string | null {
  if (isIdentifier(node)) return node.name;

  if (!isMemberExpression(node) || node.computed) {
    return null;
  }

  const objectName = isIdentifier(node.object)
    ? node.object.name
    : getMemberName(node.object);

  return objectName && isIdentifier(node.property)
    ? `${objectName}.${node.property.name}`
    : null;
}
