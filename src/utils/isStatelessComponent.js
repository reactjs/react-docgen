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

import getPropertyValuePath from './getPropertyValuePath';
import isReactComponentClass from './isReactComponentClass';
import isReactCreateClassCall from './isReactCreateClassCall';
import isReactCreateElementCall from './isReactCreateElementCall';
import isReactCloneElementCall from './isReactCloneElementCall';
import isReactChildrenElementCall from './isReactChildrenElementCall';
import recast from 'recast';
import resolveToValue from './resolveToValue';

var {types: {namedTypes: types}} = recast;

const reNonLexicalBlocks = /^If|^Else|^Switch/;

const validPossibleStatelessComponentTypes = [
  'Property',
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
];

function isJSXElementOrReactCreateElement(path) {
  return (
    path.node.type === 'JSXElement' ||
    (path.node.type === 'CallExpression' && isReactCreateElementCall(path)) ||
    (path.node.type === 'CallExpression' && isReactCloneElementCall(path)) ||
    (path.node.type === 'CallExpression' && isReactChildrenElementCall(path))
  );
}

function returnsJSXElementOrReactCreateElementCall(path) {
  let visited = false;

  // early exit for ArrowFunctionExpressions
  if (isJSXElementOrReactCreateElement(path.get('body'))) {
    return true;
  }

  function isSameBlockScope(p) {
    let block = p;
    do {
      block = block.parent;
      // jump over non-lexical blocks
      if (reNonLexicalBlocks.test(block.parent.node.type)) {
        block = block.parent;
      }
    } while (
      !types.BlockStatement.check(block.node) &&
      /Function|Property/.test(block.parent.parent.node.type) &&
      !reNonLexicalBlocks.test(block.parent.node.type)
    );

    // special case properties
    if (types.Property.check(path.node)) {
      return block.node === path.get('value', 'body').node;
    }

    return block.node === path.get('body').node;
  }

  recast.visit(path, {
    visitReturnStatement(returnPath) {
      const resolvedPath = resolveToValue(returnPath.get('argument'));
      if (
        isJSXElementOrReactCreateElement(resolvedPath) &&
        isSameBlockScope(returnPath)
      ) {
        visited = true;
        return false;
      }

      if (resolvedPath.node.type === 'CallExpression') {
        let calleeValue = resolveToValue(resolvedPath.get('callee'));

        if (returnsJSXElementOrReactCreateElementCall(calleeValue)) {
          visited = true;
          return false;
        }

        let resolvedValue;

        let namesToResolve = [calleeValue.get('property')];

        if (calleeValue.node.type === 'MemberExpression') {
          if (calleeValue.get('object').node.type === 'Identifier') {
            resolvedValue = resolveToValue(calleeValue.get('object'));
          } else if (types.MemberExpression.check(calleeValue.node)) {
            do {
              calleeValue = calleeValue.get('object');
              namesToResolve.unshift(calleeValue.get('property'));
            } while (types.MemberExpression.check(calleeValue.node));

            resolvedValue = resolveToValue(calleeValue.get('object'));
          }
        }

        if (resolvedValue && types.ObjectExpression.check(resolvedValue.node)) {
          var resolvedMemberExpression = namesToResolve
            .reduce((result, path) => { // eslint-disable-line no-shadow
              if (!path) {
                return result;
              }

              if (result) {
                result = getPropertyValuePath(result, path.node.name);
                if (result && types.Identifier.check(result.node)) {
                  return resolveToValue(result);
                }
              }
              return result;
            }, resolvedValue);

          if (
            !resolvedMemberExpression ||
            returnsJSXElementOrReactCreateElementCall(resolvedMemberExpression)
          ) {
            visited = true;
            return false;
          }
        }
      }

      this.traverse(returnPath);
    },
  });

  return visited;
}

/**
 * Returns `true` if the path represents a function which returns a JSXElement
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

  if (returnsJSXElementOrReactCreateElementCall(path)) {
    return true;
  }

  return false;
}
