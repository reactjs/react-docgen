import type { NodePath } from '@babel/traverse';
import resolveToModule from './resolveToModule';
import isReactBuiltinCall from './isReactBuiltinCall';

/**
 * Returns true if the expression is a function call of the form
 * ```
 * import createReactClass from 'create-react-class';
 * createReactClass(...);
 * ```
 */
function isReactCreateClassCallModular(path: NodePath): boolean {
  if (path.isExpressionStatement()) {
    path = path.get('expression');
  }

  if (!path.isCallExpression()) {
    return false;
  }
  const module = resolveToModule(path);
  return Boolean(module && module === 'create-react-class');
}

/**
 * Returns true if the expression is a function call of the form
 * `React.createClass(...)` or
 * ```
 * import createReactClass from 'create-react-class';
 * createReactClass(...);
 * ```
 */
export default function isReactCreateClassCall(path: NodePath): boolean {
  return (
    isReactBuiltinCall(path, 'createClass') ||
    isReactCreateClassCallModular(path)
  );
}
