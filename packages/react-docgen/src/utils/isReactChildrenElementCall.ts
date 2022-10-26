import type { NodePath } from '@babel/traverse';
import type { MemberExpression } from '@babel/types';
import isReactModuleName from './isReactModuleName';
import match from './match';
import resolveToModule from './resolveToModule';

// TODO unit tests

/**
 * Returns true if the expression is a function call of the form
 * `React.Children.only(...)`.
 */
export default function isReactChildrenElementCall(path: NodePath): boolean {
  if (path.isExpressionStatement()) {
    path = path.get('expression');
  }

  if (
    !match(path.node, { callee: { property: { name: 'only' } } }) &&
    !match(path.node, { callee: { property: { name: 'map' } } })
  ) {
    return false;
  }

  const calleeObj = (path.get('callee') as NodePath<MemberExpression>).get(
    'object',
  );

  if (!match(calleeObj.node, { property: { name: 'Children' } })) {
    return false;
  }

  const module = resolveToModule(calleeObj);

  return Boolean(module && isReactModuleName(module));
}
