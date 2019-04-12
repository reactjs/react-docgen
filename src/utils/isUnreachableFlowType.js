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
 * Returns true of the path is an unreachable TypePath
 */
export default (path: NodePath): boolean => {
  return (
    !path ||
    types.Identifier.check(path.node) ||
    types.ImportDeclaration.check(path.node) ||
    types.CallExpression.check(path.node)
  );
};
