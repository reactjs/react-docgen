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
  'ArrowFunctionExpression'
];


function isJSXElementOrReactCreateElement(path) {
  return (
    path.node.type === 'JSXElement' ||
    (path.node.type === 'CallExpression' && isReactCreateElementCall(path))
  );
}

function containsJSXElementOrReactCreateElementCall(path) {
  var visited = false;

  // early exit for ArrowFunctionExpressions
  if (isJSXElementOrReactCreateElement(path.get('body'))) {
    return true;
  }

  function isSameBlockScope(p) {
    var block = p;
    var passedAnIf = false;
    do {
      block = block.parent;
      if (/^If|^Else/.test(block.parent.node.type)) {
        passedAnIf = true;
        block = block.parent;
      }
    } while (
      !types.BlockStatement.check(block.node) &&
      /Function|Property/.test(block.parent.parent.node.type) &&
      !/^If|^Else/.test(block.parent.node.type)
    );

    // special case properties
    if (types.Property.check(path.node)) {
      return block.node === path.get('value', 'body').node;
    }

    return block.node === path.get('body').node;
  }

  recast.visit(path, {
    visitReturnStatement(returnPath) {
      var type = returnPath.get('argument').node.type;
      if (
        isJSXElementOrReactCreateElement(returnPath.get('argument')) &&
        isSameBlockScope(returnPath)
      ) {
        visited = true;
        return false;
      }
      this.traverse(returnPath);
    },
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


