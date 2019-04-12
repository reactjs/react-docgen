/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Documentation from '../Documentation';
import getPropertyName from './getPropertyName';
import { getDocblock } from './docblock';

/**
 *
 */
export default (documentation: Documentation, propertyPath: NodePath) => {
  const propName = getPropertyName(propertyPath);
  const propDescriptor = documentation.getPropDescriptor(propName);

  if (propDescriptor.description) {
    return;
  }

  propDescriptor.description = getDocblock(propertyPath) || '';
};
