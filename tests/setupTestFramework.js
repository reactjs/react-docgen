/* eslint-env jest */

const recast = require('recast');
const diff = require('jest-diff');
const utils = require('jest-matcher-utils');

const matchers = {
  toEqualASTNode: function(received, expected) {
    if (!expected || typeof expected !== 'object') {
      throw new Error(
        'Expected value must be an object representing an AST node.\n' +
          'Got ' +
          expected +
          '(' +
          typeof expected +
          ') instead.',
      );
    }

    return {
      pass: recast.types.astNodesAreEquivalent(received, expected),
      message: () => {
        const diffString = diff(expected, received);

        return (
          'Expected value to be (using ast-types):\n' +
          `  ${utils.printExpected(expected)}\n` +
          'Received:\n' +
          `  ${utils.printReceived(received)}` +
          (diffString ? `\n\nDifference:\n\n${diffString}` : '')
        );
      },
    };
  },
};

expect.extend(matchers);
