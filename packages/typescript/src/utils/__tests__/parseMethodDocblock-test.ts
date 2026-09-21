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

test('parses JSDoc compound types and untyped tags', () => {
  const parsed = parseMethodDocblock(`
@param {[string, number]} tuple
@param {string|Object|some[]} value
@param [label] Optional label.
@returns The result.
  `);

  expect(parsed.params.get('tuple')?.type).toEqual({
    name: 'tuple',
    elements: [{ name: 'string' }, { name: 'number' }],
  });
  expect(parsed.params.get('value')?.type).toEqual({
    name: 'union',
    elements: [
      { name: 'string' },
      { name: 'Object' },
      { name: 'Array', elements: [{ name: 'some' }] },
    ],
  });
  expect(parsed.params.get('label')).toEqual({
    description: 'Optional label.',
    name: 'label',
    optional: true,
  });
  expect(parsed.returns).toEqual({ description: 'The result.' });
});
