import type { NodePath } from '@babel/traverse';
import isReactModuleName from './isReactModuleName.js';
import resolveToModule from './resolveToModule.js';

/**
 * Returns true if the expression is a function call of the form
 * `React.Children.only(...)` or `React.Children.map(...)`.
 */
export default function isReactChildrenElementCall(path: NodePath): boolean {
  if (path.isExpressionStatement()) {
    path = path.get('expression');
  }

  if (!path.isCallExpression()) {
    return false;
  }

  const callee = path.get('callee');

  if (
    !callee.isMemberExpression() ||
    (!callee.get('property').isIdentifier({ name: 'only' }) &&
      !callee.get('property').isIdentifier({ name: 'map' }))
  ) {
    return false;
  }

  const calleeObj = callee.get('object');

  if (
    !calleeObj.isMemberExpression() ||
    !calleeObj.get('property').isIdentifier({ name: 'Children' })
  ) {
    return false;
  }

  const module = resolveToModule(calleeObj);

  return Boolean(module && isReactModuleName(module));
}
