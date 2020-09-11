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
import getNameOrValue from '../utils/getNameOrValue';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import resolveToValue from '../utils/resolveToValue';
import resolveFunctionDefinitionToReturnValue from '../utils/resolveFunctionDefinitionToReturnValue';
import type Documentation from '../Documentation';
import type { Importer } from '../types';

export default function displayNameHandler(
  documentation: Documentation,
  path: NodePath,
  importer: Importer,
) {
  let displayNamePath = getMemberValuePath(path, 'displayName');
  if (!displayNamePath) {
    // Function and class declarations need special treatment. The name of the
    // function / class is the displayName
    if (
      t.ClassDeclaration.check(path.node) ||
      t.FunctionDeclaration.check(path.node)
    ) {
      documentation.set('displayName', getNameOrValue(path.get('id')));
    } else if (
      t.ArrowFunctionExpression.check(path.node) ||
      t.FunctionExpression.check(path.node) ||
      isReactForwardRefCall(path, importer)
    ) {
      let currentPath = path;
      while (currentPath.parent) {
        if (t.VariableDeclarator.check(currentPath.parent.node)) {
          documentation.set(
            'displayName',
            getNameOrValue(currentPath.parent.get('id')),
          );
          return;
        } else if (t.AssignmentExpression.check(currentPath.parent.node)) {
          const leftPath = currentPath.parent.get('left');
          if (
            t.Identifier.check(leftPath.node) ||
            t.Literal.check(leftPath.node)
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
  displayNamePath = resolveToValue(displayNamePath, importer);

  // If display name is defined as a getter we get a function expression as
  // value. In that case we try to determine the value from the return
  // statement.
  if (t.FunctionExpression.check(displayNamePath.node)) {
    displayNamePath = resolveFunctionDefinitionToReturnValue(
      displayNamePath,
      importer,
    );
  }
  if (!displayNamePath || !t.Literal.check(displayNamePath.node)) {
    return;
  }
  documentation.set('displayName', displayNamePath.node.value);
}
