import {
  findExportedDefinitions,
  getParameterDefaults,
  isFunctionDeclaration,
  isObjectPattern,
} from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('collects destructured parameter defaults', () => {
  const [definition] = findExportedDefinitions(
    parseFile('export function View({ label = "Save", count }) {}'),
  );

  expect(definition).toBeDefined();

  if (!definition || !isFunctionDeclaration(definition.node)) {
    return;
  }

  const [parameter] = definition.node.params;

  expect(parameter && isObjectPattern(parameter)).toBe(true);

  if (!parameter || !isObjectPattern(parameter)) {
    return;
  }

  expect([...getParameterDefaults(parameter)]).toEqual([
    ['label', expect.objectContaining({ type: 'Literal', value: 'Save' })],
  ]);
});
