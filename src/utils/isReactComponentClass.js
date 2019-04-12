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
import resolveToValue from './resolveToValue';

const {
  types: { namedTypes: types },
} = recast;

function isRenderMethod(node) {
  const isProperty = node.type === 'ClassProperty';
  return (
    (types.MethodDefinition.check(node) || isProperty) &&
    !node.computed &&
    !node.static &&
    (node.kind === '' || node.kind === 'method' || isProperty) &&
    node.key.name === 'render'
  );
}

/**
 * Returns `true` of the path represents a class definition which either extends
 * `React.Component` or implements a `render()` method.
 */
export default function isReactComponentClass(path: NodePath): boolean {
  const node = path.node;
  if (
    !types.ClassDeclaration.check(node) &&
    !types.ClassExpression.check(node)
  ) {
    return false;
  }

  // render method
  if (node.body.body.some(isRenderMethod)) {
    return true;
  }

  // check for @extends React.Component in docblock
  if (path.parentPath && path.parentPath.value) {
    const classDeclaration = Array.isArray(path.parentPath.value)
      ? path.parentPath.value.find(function(declaration) {
          return declaration.type === 'ClassDeclaration';
        })
      : path.parentPath.value;

    if (
      classDeclaration &&
      classDeclaration.leadingComments &&
      classDeclaration.leadingComments.some(function(comment) {
        return /@extends\s+React\.Component/.test(comment.value);
      })
    ) {
      return true;
    }
  }

  // extends ReactComponent?
  if (!node.superClass) {
    return false;
  }
  const superClass = resolveToValue(path.get('superClass'));
  if (!match(superClass.node, { property: { name: 'Component' } })) {
    return false;
  }
  const module = resolveToModule(superClass);
  return !!module && isReactModuleName(module);
}
