/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
import isReactModuleName from './isReactModuleName';
import match from './match';
import resolveToModule from './resolveToModule';

/**
 * Returns true if the expression is a function call of the form
 * `React.Children.only(...)`.
 */
export default function isReactChildrenElementCall(path: NodePath): boolean {
  if (t.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }

  if (!match(path.node, { callee: { property: { name: 'only' } } })) {
    return false;
  }

  const calleeObj = path.get('callee', 'object');
  const module = resolveToModule(calleeObj);

  if (!match(calleeObj, { value: { property: { name: 'Children' } } })) {
    return false;
  }

  return Boolean(module && isReactModuleName(module));
}
