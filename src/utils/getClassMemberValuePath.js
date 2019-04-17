/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import getNameOrValue from './getNameOrValue';
import recast from 'recast';

const {
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
        !types.PrivateName.check(memberPath.node.key) &&
        getNameOrValue(memberPath.get('key')) === memberName &&
        memberPath.node.kind !== 'set',
    )
    .map(memberPath => memberPath.get('value'))[0];
}
