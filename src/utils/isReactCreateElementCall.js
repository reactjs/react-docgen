/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import isReactModuleName from './isReactModuleName';
import match from './match';
import recast from 'recast';
import resolveToModule from './resolveToModule';

const {
  types: { namedTypes: types },
} = recast;

/**
 * Returns true if the expression is a function call of the form
 * `React.createElement(...)`.
 */
export default function isReactCreateElementCall(path: NodePath): boolean {
  if (types.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }

  if (!match(path.node, { callee: { property: { name: 'createElement' } } })) {
    return false;
  }
  const module = resolveToModule(path.get('callee', 'object'));
  return Boolean(module && isReactModuleName(module));
}
