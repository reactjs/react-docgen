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
 * Returns true of the path is an unreachable TypePath
 */
export default (path: NodePath): boolean => {
  return (
    !path ||
    t.Identifier.check(path.node) ||
    t.ImportDeclaration.check(path.node) ||
    t.CallExpression.check(path.node)
  );
};
