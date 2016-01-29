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

import getMembers from '../utils/getMembers';

/**
 * Returns true of the prop is required, according to its type defintion
 */
export default function isRequiredPropType(path: NodePath): boolean {
  return getMembers(path).some(
    member => !member.computed && member.path.node.name === 'isRequired' ||
      member.computed && member.path.node.value === 'isRequired'
  );
}
