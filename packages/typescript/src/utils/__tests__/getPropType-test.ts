import { getBody, getPropType } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('extracts required built-in PropTypes', () => {
  const file = parseFile('PropTypes.string.isRequired;');
  const [statement] = getBody(file);
  const expression = statement?.get('expression');

  expect(
    expression && !Array.isArray(expression)
      ? getPropType(expression.node)
      : null,
  ).toEqual({ required: true, type: { name: 'string' } });
});

test('extracts nested PropTypes calls', () => {
  const file = parseFile(
    'PropTypes.oneOfType([PropTypes.string, PropTypes.number]);',
  );
  const [statement] = getBody(file);
  const expression = statement?.get('expression');

  expect(
    expression && !Array.isArray(expression)
      ? getPropType(expression.node)
      : null,
  ).toEqual({
    required: false,
    type: {
      name: 'union',
      value: [{ name: 'string' }, { name: 'number' }],
    },
  });
});
