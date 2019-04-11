/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import recast from 'recast';
import getNameOrValue from './getNameOrValue';

const {
  types: { namedTypes: types },
} = recast;

export const COMPUTED_PREFIX = '@computed#';

/**
 * In an ObjectExpression, the name of a property can either be an identifier
 * or a literal (or dynamic, but we don't support those). This function simply
 * returns the value of the literal or name of the identifier.
 */
export default function getPropertyName(propertyPath: NodePath): ?string {
  if (types.ObjectTypeSpreadProperty.check(propertyPath.node)) {
    return getNameOrValue(propertyPath.get('argument').get('id'), false);
  } else if (propertyPath.node.computed) {
    if (types.Identifier.check(propertyPath.node.key)) {
      return `${COMPUTED_PREFIX}${getNameOrValue(
        propertyPath.get('key'),
        false,
      )}`;
    } else if (
      types.Literal.check(propertyPath.node.key) &&
      (typeof propertyPath.node.key.value === 'string' ||
        typeof propertyPath.node.key.value === 'number')
    ) {
      return `${COMPUTED_PREFIX}${propertyPath.node.key.value}`;
    }

    return null;
  }

  return getNameOrValue(propertyPath.get('key'), false);
}
