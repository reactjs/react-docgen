/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 */

import isReactModuleName from './isReactModuleName';
import match from './match';
import recast from 'recast';
import resolveToModule from './resolveToModule';

var {
  types: { namedTypes: types },
} = recast;

/**
 * Returns true if the expression is a function call of the form
 * `React.Children.only(...)`.
 */
export default function isReactChildrenElementCall(path: NodePath): boolean {
  if (types.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }

  if (!match(path.node, { callee: { property: { name: 'only' } } })) {
    return false;
  }

  var calleeObj = path.get('callee', 'object');
  var module = resolveToModule(calleeObj);

  if (!match(calleeObj, { value: { property: { name: 'Children' } } })) {
    return false;
  }

  return Boolean(module && isReactModuleName(module));
}
