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
  const path = new NodePath(parser.parse(code));
  return path.get('program', 'body', 0, 'expression');
};
