import { findTopLevelDefinition } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('finds named top-level functions and classes', () => {
  const file = parseFile('function View() {} class Panel {}');

  expect(findTopLevelDefinition(file, 'View')?.node.type).toBe(
    'FunctionDeclaration',
  );
  expect(findTopLevelDefinition(file, 'Panel')?.node.type).toBe(
    'ClassDeclaration',
  );
  expect(findTopLevelDefinition(file, 'Missing')).toBeNull();
});
