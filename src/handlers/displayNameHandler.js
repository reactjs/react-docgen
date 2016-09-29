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

import type Documentation from '../Documentation';

import getMemberValuePath from '../utils/getMemberValuePath';
import recast from 'recast';
import resolveToValue from '../utils/resolveToValue';
import {traverseShallow} from '../utils/traverse';

const {types: {namedTypes: types}} = recast;

export default function displayNameHandler(
  documentation: Documentation,
  path: NodePath
) {
  let displayNamePath = getMemberValuePath(path, 'displayName');
  if (!displayNamePath) {
    return;
  }
  displayNamePath = resolveToValue(displayNamePath);

  // If display name is defined as a getter we get a function expression as
  // value. In that case we try to determine the value from the return
  // statement.
  if (types.FunctionExpression.check(displayNamePath.node)) {
    traverseShallow(displayNamePath.get('body'), {
      visitReturnStatement: path => {
        displayNamePath = resolveToValue(path.get('argument'));
        return false;
      },
    });
  }
  if (!displayNamePath || !types.Literal.check(displayNamePath.node)) {
    return;
  }
  documentation.set('displayName', displayNamePath.node.value);
}
