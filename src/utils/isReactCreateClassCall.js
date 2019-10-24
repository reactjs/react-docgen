/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import types from 'ast-types';
import match from './match';
import resolveToModule from './resolveToModule';
import isReactBuiltinCall from './isReactBuiltinCall';

const { namedTypes: t } = types;

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

  if (!match(path.node, { type: 'CallExpression' })) {
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
