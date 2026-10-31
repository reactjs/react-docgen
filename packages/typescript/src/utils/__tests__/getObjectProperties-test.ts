import { expect, test } from 'vitest';
import {
  getBody,
  getObjectProperties,
  isExpressionStatement,
} from '@react-docgen/core';
import parseFile from '../../__tests__/testUtils.js';

test('flattens local object spreads', () => {
  const file = parseFile(`
    const shared = { first: 1 };
    ({ ...shared, second: 2 });
  `);
  const statement = getBody(file).at(-1);

  expect(statement && isExpressionStatement(statement.node)).toBe(true);
  if (!statement || !isExpressionStatement(statement.node)) return;

  expect(
    getObjectProperties(file, statement.node.expression).map(
      (property) => property.key.type === 'Identifier' && property.key.name,
    ),
  ).toEqual(['first', 'second']);
});
