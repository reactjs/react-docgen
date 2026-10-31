import { expect, test } from 'vitest';
import {
  getResolvedEnumValues,
  isCallExpression,
  type AstNode,
} from '@react-docgen/core';
import parseFile from '../../__tests__/testUtils.js';

test('evaluates Object.keys passed to oneOf', () => {
  const file = parseFile(
    'const values = { first: 1, second: 2 }; PropTypes.oneOf(Object.keys(values));',
  );
  let call: AstNode | null = null;

  file.traverse(
    {
      CallExpression(path) {
        if (
          isCallExpression(path.node) &&
          path.node.arguments[0]?.type === 'CallExpression'
        ) {
          call = path.node;
          path.stop();
        }
      },
    },
    undefined,
  );
  expect(call ? getResolvedEnumValues(file, call) : null).toEqual([
    { computed: false, value: '"first"' },
    { computed: false, value: '"second"' },
  ]);
});
