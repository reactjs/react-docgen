import { expect, test } from 'vitest';
import { unwrapExpression, type AstNode } from '@react-docgen/core';
import parseFile from '../../__tests__/testUtils.js';

test('unwraps nested TypeScript expression wrappers', () => {
  const file = parseFile('const value = (input as unknown as string)!;');
  const declaration = file.ast.body[0];
  const init =
    declaration?.declarations && Array.isArray(declaration.declarations)
      ? declaration.declarations[0]?.init
      : null;

  expect(
    init && typeof init === 'object' && 'type' in init
      ? unwrapExpression(init as AstNode)
      : null,
  ).toMatchObject({ type: 'Identifier', name: 'input' });
});
