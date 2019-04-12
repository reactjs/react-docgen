/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import recast from 'recast';
const {
  types: { namedTypes: types },
} = recast;

/**
 * Returns the path to the first part of the MemberExpression. I.e. given a
 * path representing
 *
 * foo.bar.baz
 *
 * it returns the path of/to `foo`.
 */
export default function getMemberExpressionRoot(
  memberExpressionPath: NodePath,
): NodePath {
  do {
    memberExpressionPath = memberExpressionPath.get('object');
  } while (types.MemberExpression.check(memberExpressionPath.node));
  return memberExpressionPath;
}
