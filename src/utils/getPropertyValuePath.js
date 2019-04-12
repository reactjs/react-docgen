/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import getPropertyName from './getPropertyName';
import recast from 'recast';

const {
  types: { namedTypes: types },
} = recast;

/**
 * Given an ObjectExpression, this function returns the path of the value of
 * the property with name `propertyName`.
 */
export default function getPropertyValuePath(
  path: NodePath,
  propertyName: string,
): ?NodePath {
  types.ObjectExpression.assert(path.node);

  return path
    .get('properties')
    .filter(propertyPath => getPropertyName(propertyPath) === propertyName)
    .map(propertyPath => propertyPath.get('value'))[0];
}
