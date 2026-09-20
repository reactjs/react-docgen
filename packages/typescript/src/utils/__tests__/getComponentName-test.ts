import { findTopLevelDefinition, getComponentName } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('returns declaration names', () => {
  const file = parseFile('function View() {}');
  const definition = findTopLevelDefinition(file, 'View');

  expect(definition && getComponentName(definition)).toBe('View');
});
