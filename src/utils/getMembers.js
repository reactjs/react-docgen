/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';

type MemberDescriptor = {
  path: NodePath,
  computed: boolean,
  argumentsPath?: ?NodePath,
};

/**
 * Given a "nested" Member/CallExpression, e.g.
 *
 * foo.bar()[baz][42]
 *
 * this returns a list of "members". In this example it would be something like
 * [
 *   {path: NodePath<bar>, arguments: NodePath<empty>, computed: false},
 *   {path: NodePath<baz>, arguments: null, computed: true},
 *   {path: NodePath<42>, arguments: null, computed: false}
 * ]
 */
export default function getMembers(
  path: NodePath,
  includeRoot: boolean = false,
): Array<MemberDescriptor> {
  const result = [];
  let argumentsPath = null;
  // eslint-disable-next-line no-constant-condition
  loop: while (true) {
    switch (true) {
      case t.MemberExpression.check(path.node):
        result.push({
          path: path.get('property'),
          computed: path.node.computed,
          argumentsPath: argumentsPath,
        });
        argumentsPath = null;
        path = path.get('object');
        break;
      case t.CallExpression.check(path.node):
        argumentsPath = path.get('arguments');
        path = path.get('callee');
        break;
      default:
        break loop;
    }
  }
  if (includeRoot && result.length > 0) {
    result.push({
      path,
      computed: false,
      argumentsPath,
    });
  }
  return result.reverse();
}
