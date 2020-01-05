/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import getMembers from '../utils/getMembers';

/**
 * Returns true of the prop is required, according to its type defintion
 */
export default function isRequiredPropType(path: NodePath): boolean {
  return getMembers(path).some(
    member =>
      (!member.computed && member.path.node.name === 'isRequired') ||
      (member.computed && member.path.node.value === 'isRequired'),
  );
}
