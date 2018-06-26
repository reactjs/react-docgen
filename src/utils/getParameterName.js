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

import recast from 'recast';

import printValue from './printValue';

const {
  types: { namedTypes: types },
} = recast;

export default function getParameterName(parameterPath: NodePath): string {
  switch (parameterPath.node.type) {
    case types.Identifier.name:
      return parameterPath.node.name;
    case types.AssignmentPattern.name:
      return getParameterName(parameterPath.get('left'));
    case types.ObjectPattern.name:
    case types.ArrayPattern.name:
      return printValue(parameterPath);
    case types.RestElement.name:
      return '...' + getParameterName(parameterPath.get('argument'));
    default:
      throw new TypeError(
        'Parameter name must be an Identifier, an AssignmentPattern an ' +
          `ObjectPattern or a RestElement, got ${parameterPath.node.type}`,
      );
  }
}
