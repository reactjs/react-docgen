/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import types from 'ast-types';

const { namedTypes: t } = types;

/**
 * If node is an Identifier, it returns its name. If it is a literal, it returns
 * its value.
 */
export default function getNameOrValue(path: NodePath, raw?: boolean): string {
  const node = path.node;
  switch (node.type) {
    case t.Identifier.name:
      return node.name;
    case t.Literal.name:
      return raw ? node.raw : node.value;
    default:
      throw new TypeError('Argument must be an Identifier or a Literal');
  }
}
