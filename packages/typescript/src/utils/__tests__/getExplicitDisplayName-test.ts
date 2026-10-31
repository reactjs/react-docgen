import { getExplicitDisplayName } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('finds literal display name assignments', () => {
  const file = parseFile(`
    export function View() {}
    View.displayName = 42;
  `);

  expect(getExplicitDisplayName(file, 'View')).toBe(42);
  expect(getExplicitDisplayName(file, 'Other')).toBeUndefined();
});
