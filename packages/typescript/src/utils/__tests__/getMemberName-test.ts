import { getBody, getMemberName } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('returns dotted member names', () => {
  const file = parseFile('PropTypes.string.isRequired;');
  const [statement] = getBody(file);
  const expression = statement?.get('expression');

  expect(expression && !Array.isArray(expression)).toBeTruthy();
  expect(
    expression && !Array.isArray(expression)
      ? getMemberName(expression.node)
      : null,
  ).toBe('PropTypes.string.isRequired');
});

test('returns identifier names', () => {
  const file = parseFile('useImperativeHandle();');
  const [statement] = getBody(file);
  const expression = statement?.get('expression');
  const callee =
    expression && !Array.isArray(expression) ? expression.get('callee') : null;

  expect(
    callee && !Array.isArray(callee) ? getMemberName(callee.node) : null,
  ).toBe('useImperativeHandle');
});
