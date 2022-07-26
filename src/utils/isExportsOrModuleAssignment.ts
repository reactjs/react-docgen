import type { NodePath } from '@babel/traverse';
import * as expressionTo from './expressionTo';

/**
 * Returns true if the expression is of form `exports.foo = ...;` or
 * `modules.exports = ...;`.
 */
export default function isExportsOrModuleAssignment(path: NodePath): boolean {
  if (path.isExpressionStatement()) {
    path = path.get('expression');
  }
  if (
    !path.isAssignmentExpression() ||
    !path.get('left').isMemberExpression()
  ) {
    return false;
  }

  const exprArr = expressionTo.Array(path.get('left'));

  return (
    (exprArr[0] === 'module' && exprArr[1] === 'exports') ||
    exprArr[0] === 'exports'
  );
}
