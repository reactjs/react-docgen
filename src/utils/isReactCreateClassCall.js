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

var {types: {namedTypes: types}} = recast;

/**
 * Returns true if the expression is a function call of the form
 * `React.createClass(...)`.
 */
function isReactCreateClassCallBuiltIn(path: NodePath): boolean {
  if (types.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }

  if (!match(path.node, {callee: {property: {name: 'createClass'}}})) {
    return false;
  }
  var module = resolveToModule(path.get('callee', 'object'));
  return Boolean(module && isReactModuleName(module));
}


/**
 * Returns true if the expression is a function call of the form
 * ```
 * import createReactClass from 'create-react-class';
 * createReactClass(...);
 * ```
 */
function isReactCreateClassCallModular(path: NodePath): boolean {
  if (types.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }

  if (!match(path.node, {type: 'CallExpression'})) {
    return false;
  }
  var module = resolveToModule(path.get('callee', 'object'));
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
  return isReactCreateClassCallBuiltIn(path) || isReactCreateClassCallModular(path)
}
