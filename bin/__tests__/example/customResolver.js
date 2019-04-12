/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Dummy resolver that always returns the same AST node
 */

const code = `
  ({
    displayName: 'Custom',
  })
`;

module.exports = function(ast, recast) {
  return new recast.types.NodePath(recast.parse(code)).get(
    'program',
    'body',
    0,
    'expression'
  );
};
