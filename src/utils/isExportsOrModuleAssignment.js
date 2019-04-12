/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as expressionTo from './expressionTo';
import recast from 'recast';

const {
  types: { namedTypes: types },
} = recast;

/**
 * Returns true if the expression is of form `exports.foo = ...;` or
 * `modules.exports = ...;`.
 */
export default function isExportsOrModuleAssignment(path: NodePath): boolean {
  if (types.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }
  if (
    !types.AssignmentExpression.check(path.node) ||
    !types.MemberExpression.check(path.node.left)
  ) {
    return false;
  }

  const exprArr = expressionTo.Array(path.get('left'));
  return (
    (exprArr[0] === 'module' && exprArr[1] === 'exports') ||
    exprArr[0] === 'exports'
  );
}
