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
