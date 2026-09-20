import { expect, test } from 'vitest';
import {
  isLiteral,
  isVariableDeclaration,
  isVariableDeclarator,
  resolveValue,
} from '@react-docgen/core';
import parseFile from '../../__tests__/testUtils.js';

test('resolves a value imported from another file', () => {
  const file = parseFile(
    'import { label } from "./values"; const value = label;',
    'component.tsx',
    () => ({ code: 'export const label = "Save";', filename: 'values.ts' }),
  );
  const declaration = file.ast.body[1];
  const variable =
    declaration && isVariableDeclaration(declaration)
      ? declaration.declarations[0]
      : null;
  const init =
    variable && isVariableDeclarator(variable) ? variable.init : null;
  const value = init ? resolveValue(file, init) : null;

  expect(value && isLiteral(value) ? value.value : null).toBe('Save');
});
