/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import types from 'ast-types';
import getPropertyName from './getPropertyName';

const { namedTypes: t } = types;

/**
 * Given an ObjectExpression, this function returns the path of the value of
 * the property with name `propertyName`.
 */
export default function getPropertyValuePath(
  path: NodePath,
  propertyName: string,
): ?NodePath {
  t.ObjectExpression.assert(path.node);

  return path
    .get('properties')
    .filter(propertyPath => getPropertyName(propertyPath) === propertyName)
    .map(propertyPath => propertyPath.get('value'))[0];
}
