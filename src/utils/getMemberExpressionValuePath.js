/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t, visit } from 'ast-types';
import getNameOrValue from './getNameOrValue';
import { String as toString } from './expressionTo';
import isReactForwardRefCall from './isReactForwardRefCall';
import type { Importer } from '../types';

function resolveName(path, importer) {
  if (t.VariableDeclaration.check(path.node)) {
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

  if (t.FunctionDeclaration.check(path.node)) {
    return path.get('id', 'name').value;
  }

  if (
    t.FunctionExpression.check(path.node) ||
    t.ArrowFunctionExpression.check(path.node) ||
    t.TaggedTemplateExpression.check(path.node) ||
    t.CallExpression.check(path.node) ||
    isReactForwardRefCall(path, importer)
  ) {
    let currentPath = path;
    while (currentPath.parent) {
      if (t.VariableDeclarator.check(currentPath.parent.node)) {
        return currentPath.parent.get('id', 'name').value;
      }

      currentPath = currentPath.parent;
    }

    return;
  }

  throw new TypeError(
    'Attempted to resolveName for an unsupported path. resolveName accepts a ' +
      'VariableDeclaration, FunctionDeclaration, FunctionExpression or CallExpression. Got "' +
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
  importer: Importer,
): ?NodePath {
  const localName = resolveName(variableDefinition, importer);
  const program = getRoot(variableDefinition);

  if (!localName) {
    // likely an immediately exported and therefore nameless/anonymous node
    // passed in
    return;
  }

  let result;
  visit(program, {
    visitAssignmentExpression(path) {
      const memberPath = path.get('left');
      if (!t.MemberExpression.check(memberPath.node)) {
        return this.traverse(path);
      }

      if (
        (!memberPath.node.computed ||
          t.Literal.check(memberPath.node.property)) &&
        getNameOrValue(memberPath.get('property')) === memberName &&
        toString(memberPath.get('object'), importer) === localName
      ) {
        result = path.get('right');
        return false;
      }

      this.traverse(memberPath);
    },
  });

  return result;
}
