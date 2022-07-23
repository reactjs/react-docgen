/* eslint-env jest */
import type { Node } from '@babel/traverse';
import { NodePath } from '@babel/traverse';
import { isNodesEquivalent, removePropertiesDeep } from '@babel/types';
import { diff } from 'jest-diff';
import { printExpected, printReceived } from 'jest-matcher-utils';

const matchers = {
  toEqualASTNode: function (received: NodePath, expected: Node | NodePath) {
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
    const receivedNode = received.node;
    let expectedNode: Node;
    if (expected instanceof NodePath) {
      expectedNode = expected.node;
    } else {
      expectedNode = expected;
    }
    if (expectedNode.type === 'MemberExpression') {
      // Babel 7 always adds this optional field which is wrong
      // Fixed in babel v8
      delete expectedNode.optional;
    }

    return {
      pass: isNodesEquivalent(receivedNode, expectedNode),
      message: () => {
        removePropertiesDeep(expectedNode);
        removePropertiesDeep(receivedNode);
        const diffString = diff(expectedNode, receivedNode);

        return (
          'Expected value to be:\n' +
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
