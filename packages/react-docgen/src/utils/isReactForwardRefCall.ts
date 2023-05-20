import type { NodePath } from '@babel/traverse';
import isReactBuiltinCall from './isReactBuiltinCall.js';
import type { CallExpression } from '@babel/types';

/**
 * Returns true if the expression is a function call of the form
 * `React.forwardRef(...)`.
 */
export default function isReactForwardRefCall(
  path: NodePath,
): path is NodePath<CallExpression & { __reactBuiltinTypeHint: true }> {
  return (
    isReactBuiltinCall(path, 'forwardRef') &&
    (path as NodePath<CallExpression>).get('arguments').length === 1
  );
}
