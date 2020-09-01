/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
import getPropertyName from './getPropertyName';
import type { Importer } from '../types';

/**
 * Given an ObjectExpression, this function returns the path of the value of
 * the property with name `propertyName`.
 */
export default function getPropertyValuePath(
  path: NodePath,
  propertyName: string,
  importer: Importer,
): ?NodePath {
  t.ObjectExpression.assert(path.node);

  return path
    .get('properties')
    .filter(propertyPath => getPropertyName(propertyPath, importer) === propertyName)
    .map(propertyPath => propertyPath.get('value'))[0];
}
