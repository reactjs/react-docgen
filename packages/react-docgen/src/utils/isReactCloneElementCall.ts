import type { NodePath } from '@babel/traverse';
import type { CallExpression } from '@babel/types';
import isReactBuiltinCall from './isReactBuiltinCall.js';

/**
 * Returns true if the expression is a function call of the form
 * `React.cloneElement(...)`.
 */
export default function isReactCloneElementCall(
  path: NodePath,
): path is NodePath<CallExpression & { __reactBuiltinTypeHint: true }> {
  return isReactBuiltinCall(path, 'cloneElement');
}
