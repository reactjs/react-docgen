/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import isReactModuleName from './isReactModuleName';
import match from './match';
import recast from 'recast';
import resolveToModule from './resolveToModule';
import resolveToValue from './resolveToValue';

var {types: {namedTypes: types}} = recast;

function isRenderMethod(node) {
  return types.MethodDefinition.check(node) &&
    !node.computed &&
    !node.static &&
    (node.kind === '' || node.kind === 'method') &&
    node.key.name === 'render';
}

/**
 * Returns `true` of the path represents a class definition which either extends
 * `React.Component` or implements a `render()` method.
 */
export default function isReactComponentClass(
  path: NodePath
): bool {
  var node = path.node;
  if (!types.ClassDeclaration.check(node) &&
    !types.ClassExpression.check(node)) {
    return false;
  }

  // render method
  if (node.body.body.some(isRenderMethod)) {
    return true;
  }

  // extends ReactComponent?
  if (!node.superClass) {
    return false;
  }
  var superClass = resolveToValue(path.get('superClass'));
  if (!match(superClass.node, {property: {name: 'Component'}})) {
    return false;
  }
  var module = resolveToModule(superClass);
  return !!module && isReactModuleName(module);
}
