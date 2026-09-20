import { isIdentifier, isLiteral, type AstNode } from '../internal.js';

export default function getPropertyName(node: AstNode): string | null {
  if (isIdentifier(node)) return node.name;
  if (
    isLiteral(node) &&
    (typeof node.value === 'string' || typeof node.value === 'number')
  ) {
    return String(node.value);
  }

  return null;
}
