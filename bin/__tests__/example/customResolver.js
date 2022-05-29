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

const { NodePath } = require('ast-types');

module.exports = function (ast, parser) {
  return new NodePath(parser.parse(code)).get(
    'program',
    'body',
    0,
    'expression'
  );
};
