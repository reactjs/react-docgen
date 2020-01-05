/* eslint-env jest */

const types = require('ast-types');
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

    // Use value here instead of node, as node has some magic and always returns
    // the next Node it finds even if value is an array
    const receivedNode = received.value;
    let expectedNode = expected;
    if (expected instanceof types.NodePath) {
      expectedNode = expected.value;
    }

    return {
      pass: types.astNodesAreEquivalent(receivedNode, expectedNode),
      message: () => {
        const diffString = diff(expectedNode, receivedNode);

        return (
          'Expected value to be (using ast-types):\n' +
          `  ${utils.printExpected(expectedNode)}\n` +
          'Received:\n' +
          `  ${utils.printReceived(receivedNode)}` +
          (diffString ? `\n\nDifference:\n\n${diffString}` : '')
        );
      },
    };
  },
};

expect.extend(matchers);
