/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
