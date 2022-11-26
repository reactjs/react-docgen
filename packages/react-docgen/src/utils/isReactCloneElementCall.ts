import type { NodePath } from '@babel/traverse';
import type { Expression, ExpressionStatement } from '@babel/types';
import isReactBuiltinCall from './isReactBuiltinCall.js';

/**
 * Returns true if the expression is a function call of the form
 * `React.cloneElement(...)`.
 */
export default function isReactCloneElementCall(
  path: NodePath<Expression | ExpressionStatement>,
): boolean {
  return isReactBuiltinCall(path, 'cloneElement');
}
