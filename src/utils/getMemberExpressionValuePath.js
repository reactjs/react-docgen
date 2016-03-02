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
import recast from 'recast';
import resolveName from './resolveName';

var {types: {namedTypes: types}} = recast;

function getRoot(node) {
  var root = node.parent;
  while (root.parent) {
    root = root.parent;
  }
  return root;
}

export default function getMemberExpressionValuePath(
  variableDefinition: NodePath,
  memberName: string
): ?NodePath {
  var localName = resolveName(variableDefinition);
  var program = getRoot(variableDefinition);

  if (!localName) {
    // likely an immediately exported and therefore nameless/anonymous node
    // passed in
    return;
  }

  var result;
  recast.visit(program, {
    visitAssignmentExpression(path) {
      var memberPath = path.get('left');
      if (!types.MemberExpression.check(memberPath.node)) {
        return this.traverse(path);
      }

      if (
        (!memberPath.node.computed || types.Literal.check(memberPath.node.property)) &&
        getNameOrValue(memberPath.get('property')) === memberName
      ) {
        result = path.get('right');
        return false;
      }

      this.traverse(memberPath);
    },
  });

  return result; // eslint-disable-line consistent-return
}
