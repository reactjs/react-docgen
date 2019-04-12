/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Documentation from '../Documentation';

import getMemberValuePath from '../utils/getMemberValuePath';
import getNameOrValue from '../utils/getNameOrValue';
import recast from 'recast';
import resolveToValue from '../utils/resolveToValue';
import resolveFunctionDefinitionToReturnValue from '../utils/resolveFunctionDefinitionToReturnValue';

const {
  types: { namedTypes: types },
} = recast;

export default function displayNameHandler(
  documentation: Documentation,
  path: NodePath,
) {
  let displayNamePath = getMemberValuePath(path, 'displayName');
  if (!displayNamePath) {
    // Function and class declarations need special treatment. The name of the
    // function / class is the displayName
    if (
      types.ClassDeclaration.check(path.node) ||
      types.FunctionDeclaration.check(path.node)
    ) {
      documentation.set('displayName', getNameOrValue(path.get('id')));
    } else if (
      types.ArrowFunctionExpression.check(path.node) ||
      types.FunctionExpression.check(path.node)
    ) {
      let currentPath = path;
      while (currentPath.parent) {
        if (types.VariableDeclarator.check(currentPath.parent.node)) {
          documentation.set(
            'displayName',
            getNameOrValue(currentPath.parent.get('id')),
          );
          return;
        } else if (types.AssignmentExpression.check(currentPath.parent.node)) {
          const leftPath = currentPath.parent.get('left');
          if (
            types.Identifier.check(leftPath.node) ||
            types.Literal.check(leftPath.node)
          ) {
            documentation.set('displayName', getNameOrValue(leftPath));
            return;
          }
        }
        currentPath = currentPath.parent;
      }
    }
    return;
  }
  displayNamePath = resolveToValue(displayNamePath);

  // If display name is defined as a getter we get a function expression as
  // value. In that case we try to determine the value from the return
  // statement.
  if (types.FunctionExpression.check(displayNamePath.node)) {
    displayNamePath = resolveFunctionDefinitionToReturnValue(displayNamePath);
  }
  if (!displayNamePath || !types.Literal.check(displayNamePath.node)) {
    return;
  }
  documentation.set('displayName', displayNamePath.node.value);
}
