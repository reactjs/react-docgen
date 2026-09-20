import { parseMethodDocblock } from '@react-docgen/core';
import { expect, test } from 'vitest';

test('parses method summary, parameters, and return tags', () => {
  const parsed = parseMethodDocblock(
    'Formats a value.\n@param {string=} value Input.\n@returns {number} Length.',
  );

  expect(parsed.description).toBe('Formats a value.');
  expect(parsed.params.get('value')).toEqual({
    description: 'Input.',
    name: 'value',
    optional: true,
    type: { name: 'string' },
  });
  expect(parsed.returns).toEqual({
    description: 'Length.',
    type: { name: 'number' },
  });
});
