/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
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
  if (t.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }

  if (!t.CallExpression.check(path.node)) {
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
