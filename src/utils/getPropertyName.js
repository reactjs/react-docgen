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

import getNameOrValue from './getNameOrValue';

/**
 * In an ObjectExpression, the name of a property can either be an identifier
 * or a literal (or dynamic, but we don't support those). This function simply
 * returns the value of the literal or name of the identifier.
 */
export default function getPropertyName(propertyPath: NodePath): string {
  if (propertyPath.node.computed) {
    throw new TypeError('Propery name must be an Identifier or a Literal');
  }

  return getNameOrValue(propertyPath.get('key'), false);
}
