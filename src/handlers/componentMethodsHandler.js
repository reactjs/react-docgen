/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
import getMemberValuePath from '../utils/getMemberValuePath';
import getMethodDocumentation from '../utils/getMethodDocumentation';
import isReactComponentClass from '../utils/isReactComponentClass';
import isReactComponentMethod from '../utils/isReactComponentMethod';
import type Documentation from '../Documentation';
import match from '../utils/match';
import { traverseShallow } from '../utils/traverse';
import resolveToValue from '../utils/resolveToValue';

/**
 * The following values/constructs are considered methods:
 *
 * - Method declarations in classes (except "constructor" and React lifecycle
 *   methods
 * - Public class fields in classes whose value are a functions
 * - Object properties whose values are functions
 */
function isMethod(path) {
  const isProbablyMethod =
    (t.MethodDefinition.check(path.node) && path.node.kind !== 'constructor') ||
    ((t.ClassProperty.check(path.node) || t.Property.check(path.node)) &&
      t.Function.check(path.get('value').node));

  return isProbablyMethod && !isReactComponentMethod(path);
}

function findAssignedMethods(scope, idPath) {
  const results = [];

  if (!t.Identifier.check(idPath.node)) {
    return results;
  }

  const name = idPath.node.name;
  const idScope = idPath.scope.lookup(idPath.node.name);

  traverseShallow((scope: any).path, {
    visitAssignmentExpression: function(path) {
      const node = path.node;
      if (
        match(node.left, {
          type: 'MemberExpression',
          object: { type: 'Identifier', name },
        }) &&
        path.scope.lookup(name) === idScope &&
        t.Function.check(resolveToValue(path.get('right')).node)
      ) {
        results.push(path);
        return false;
      }
      return this.traverse(path);
    },
  });

  return results;
}

/**
 * Extract all flow types for the methods of a react component. Doesn't
 * return any react specific lifecycle methods.
 */
export default function componentMethodsHandler(
  documentation: Documentation,
  path: NodePath,
) {
  // Extract all methods from the class or object.
  let methodPaths = [];
  if (isReactComponentClass(path)) {
    methodPaths = path.get('body', 'body').filter(isMethod);
  } else if (t.ObjectExpression.check(path.node)) {
    methodPaths = path.get('properties').filter(isMethod);

    // Add the statics object properties.
    const statics = getMemberValuePath(path, 'statics');
    if (statics) {
      statics.get('properties').each(p => {
        if (isMethod(p)) {
          p.node.static = true;
          methodPaths.push(p);
        }
      });
    }
  } else if (
    t.VariableDeclarator.check(path.parent.node) &&
    path.parent.node.init === path.node &&
    t.Identifier.check(path.parent.node.id)
  ) {
    methodPaths = findAssignedMethods(path.parent.scope, path.parent.get('id'));
  } else if (
    t.AssignmentExpression.check(path.parent.node) &&
    path.parent.node.right === path.node &&
    t.Identifier.check(path.parent.node.left)
  ) {
    methodPaths = findAssignedMethods(
      path.parent.scope,
      path.parent.get('left'),
    );
  } else if (t.FunctionDeclaration.check(path.node)) {
    methodPaths = findAssignedMethods(path.parent.scope, path.get('id'));
  }

  documentation.set(
    'methods',
    methodPaths.map(getMethodDocumentation).filter(Boolean),
  );
}
