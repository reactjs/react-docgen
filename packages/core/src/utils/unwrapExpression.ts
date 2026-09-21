import type { AstNode } from '../internal.js';

const wrappers = new Set([
  'ChainExpression',
  'TypeCastExpression',
  'TSAsExpression',
  'TSNonNullExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion',
]);

export default function unwrapExpression(node: AstNode): AstNode {
  let current = node;

  while (wrappers.has(current.type)) {
    const expression = current.expression;

    if (
      !expression ||
      typeof expression !== 'object' ||
      !('type' in expression)
    ) {
      break;
    }
    current = expression as AstNode;
  }

  return current;
}
