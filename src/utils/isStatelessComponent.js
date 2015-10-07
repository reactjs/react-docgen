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
import isReactComponentClass from './isReactComponentClass';
import isReactCreateClassCall from './isReactCreateClassCall';
import isReactCreateElementCall from './isReactCreateElementCall';
import match from './match';
import recast from 'recast';
import resolveToModule from './resolveToModule';
import resolveToValue from './resolveToValue';

var {types: {namedTypes: types}} = recast;

const validPossibleStatelessComponentTypes = [
  'Property',
  'FunctionDeclaration',
  'FunctionExpression',
  // TODO: maybe include these variants for safety:
  // https://github.com/benjamn/ast-types/blob/master/def/es6.js#L31
  // https://github.com/estree/estree/issues/2
  // 'ArrowExpression', 'ArrowFunction'
  'ArrowFunctionExpression'
];

function containsJSXElementOrReactCreateElementCall(path) {
  var visited = false;
  recast.visit(path, {
    visitJSXElement(path) {
      visited = true;
      return false;
    },

    visitCallExpression(path) {
      if (isReactCreateElementCall(path)) {
        visited = true;
        return false;
      }

      this.traverse(path);
    }
  });

  return visited;
}

/**
 * Returns `true` if the path represents a function which returns a JSXElment
 */
export default function isStatelessComponent(
  path: NodePath
): bool {
  var node = path.node;

  if (validPossibleStatelessComponentTypes.indexOf(node.type) === -1) {
    return false;
  }

  if (node.type === 'Property') {
    if (isReactCreateClassCall(path.parent) || isReactComponentClass(path.parent)) {
      return false;
    }
  }

  if (containsJSXElementOrReactCreateElementCall(path)) {
    return true;
  }

  return false;
}


