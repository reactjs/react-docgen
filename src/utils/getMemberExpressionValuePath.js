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

import getNameOrValue from './getNameOrValue';
import { String as toString } from './expressionTo';
import recast from 'recast';

const {
  types: { namedTypes: types },
} = recast;

function resolveName(path) {
  if (types.VariableDeclaration.check(path.node)) {
    const declarations = path.get('declarations');
    if (declarations.value.length && declarations.value.length !== 1) {
      throw new TypeError(
        'Got unsupported VariableDeclaration. VariableDeclaration must only ' +
          'have a single VariableDeclarator. Got ' +
          declarations.value.length +
          ' declarations.',
      );
    }
    const value = declarations.get(0, 'id', 'name').value;
    return value;
  }

  if (types.FunctionDeclaration.check(path.node)) {
    return path.get('id', 'name').value;
  }

  if (
    types.FunctionExpression.check(path.node) ||
    types.ArrowFunctionExpression.check(path.node) ||
    types.TaggedTemplateExpression.check(path.node)
  ) {
    let currentPath = path;
    while (currentPath.parent) {
      if (types.VariableDeclarator.check(currentPath.parent.node)) {
        return currentPath.parent.get('id', 'name').value;
      }

      currentPath = currentPath.parent;
    }

    return;
  }

  throw new TypeError(
    'Attempted to resolveName for an unsupported path. resolveName accepts a ' +
      'VariableDeclaration, FunctionDeclaration, or FunctionExpression. Got "' +
      path.node.type +
      '".',
  );
}

function getRoot(node) {
  let root = node.parent;
  while (root.parent) {
    root = root.parent;
  }
  return root;
}

export default function getMemberExpressionValuePath(
  variableDefinition: NodePath,
  memberName: string,
): ?NodePath {
  const localName = resolveName(variableDefinition);
  const program = getRoot(variableDefinition);

  if (!localName) {
    // likely an immediately exported and therefore nameless/anonymous node
    // passed in
    return;
  }

  let result;
  recast.visit(program, {
    visitAssignmentExpression(path) {
      const memberPath = path.get('left');
      if (!types.MemberExpression.check(memberPath.node)) {
        return this.traverse(path);
      }

      if (
        (!memberPath.node.computed ||
          types.Literal.check(memberPath.node.property)) &&
        getNameOrValue(memberPath.get('property')) === memberName &&
        toString(memberPath.get('object')) === localName
      ) {
        result = path.get('right');
        return false;
      }

      this.traverse(memberPath);
    },
  });

  return result;
}
