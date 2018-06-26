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
import recast from 'recast';

var {
  types: { namedTypes: types },
} = recast;

export default function getClassMemberValuePath(
  classDefinition: NodePath,
  memberName: string,
): ?NodePath {
  // Fortunately it seems like that all members of a class body, be it
  // ClassProperty or MethodDefinition, have the same structure: They have a
  // "key" and a "value"
  return classDefinition
    .get('body', 'body')
    .filter(
      memberPath =>
        (!memberPath.node.computed ||
          types.Literal.check(memberPath.node.key)) &&
        getNameOrValue(memberPath.get('key')) === memberName &&
        memberPath.node.kind !== 'set',
    )
    .map(memberPath => memberPath.get('value'))[0];
}
