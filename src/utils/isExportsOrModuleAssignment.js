/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
import * as expressionTo from './expressionTo';
import type { Importer } from '../types';

/**
 * Returns true if the expression is of form `exports.foo = ...;` or
 * `modules.exports = ...;`.
 */
export default function isExportsOrModuleAssignment(
  path: NodePath,
  importer: Importer,
): boolean {
  if (t.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }
  if (
    !t.AssignmentExpression.check(path.node) ||
    !t.MemberExpression.check(path.node.left)
  ) {
    return false;
  }

  const exprArr = expressionTo.Array(path.get('left'), importer);
  return (
    (exprArr[0] === 'module' && exprArr[1] === 'exports') ||
    exprArr[0] === 'exports'
  );
}
