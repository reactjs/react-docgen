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

import recast from 'recast';
var {
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
