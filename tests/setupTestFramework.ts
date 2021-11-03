/* eslint-env jest */

import {
  NodePath as NodePathConstructor,
  astNodesAreEquivalent,
  ASTNode,
} from 'ast-types';
import { NodePath } from 'ast-types/lib/node-path';
import { diff } from 'jest-diff';
import { printExpected, printReceived } from 'jest-matcher-utils';

const matchers = {
  toEqualASTNode: function (received: NodePath, expected: NodePath | ASTNode) {
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
    if (expected instanceof NodePathConstructor) {
      expectedNode = expected.value;
    }

    return {
      pass: astNodesAreEquivalent(receivedNode, expectedNode),
      message: () => {
        const diffString = diff(expectedNode, receivedNode);

        return (
          'Expected value to be (using ast-types):\n' +
          `  ${printExpected(expectedNode)}\n` +
          'Received:\n' +
          `  ${printReceived(receivedNode)}` +
          (diffString ? `\n\nDifference:\n\n${diffString}` : '')
        );
      },
    };
  },
};

expect.extend(matchers);
