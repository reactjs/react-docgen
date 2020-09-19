/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
import getNameOrValue from './getNameOrValue';
import type { Importer } from '../types';

export default function getClassMemberValuePath(
  classDefinition: NodePath,
  memberName: string,
  _importer: Importer,
): ?NodePath {
  // Fortunately it seems like that all members of a class body, be it
  // ClassProperty or MethodDefinition, have the same structure: They have a
  // "key" and a "value"
  return classDefinition
    .get('body', 'body')
    .filter(
      memberPath =>
        (!memberPath.node.computed || t.Literal.check(memberPath.node.key)) &&
        !t.PrivateName.check(memberPath.node.key) &&
        getNameOrValue(memberPath.get('key')) === memberName &&
        memberPath.node.kind !== 'set',
    )
    .map(memberPath => memberPath.get('value'))[0];
}
