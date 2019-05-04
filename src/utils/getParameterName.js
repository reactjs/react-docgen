/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import types from 'ast-types';
import printValue from './printValue';

const { namedTypes: t } = types;

export default function getParameterName(parameterPath: NodePath): string {
  switch (parameterPath.node.type) {
    case t.Identifier.name:
      return parameterPath.node.name;
    case t.AssignmentPattern.name:
      return getParameterName(parameterPath.get('left'));
    case t.ObjectPattern.name:
    case t.ArrayPattern.name:
      return printValue(parameterPath);
    case t.RestElement.name:
      return '...' + getParameterName(parameterPath.get('argument'));
    default:
      throw new TypeError(
        'Parameter name must be an Identifier, an AssignmentPattern an ' +
          `ObjectPattern or a RestElement, got ${parameterPath.node.type}`,
      );
  }
}
