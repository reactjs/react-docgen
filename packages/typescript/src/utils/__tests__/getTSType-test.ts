import { expect, test } from 'vitest';
import {
  isTSInterfaceDeclaration,
  isTSPropertySignature,
} from '@react-docgen/core';
import parseFile from '../../__tests__/testUtils.js';
import getTSType from '../getTSType.js';

test('serializes composite TypeScript types', () => {
  const file = parseFile('interface Props { value: string | number[] }');
  const declaration = file.ast.body[0];
  const member =
    declaration && isTSInterfaceDeclaration(declaration)
      ? declaration.body.body[0]
      : null;

  expect(
    member && isTSPropertySignature(member)
      ? getTSType(file, member.typeAnnotation)
      : null,
  ).toEqual({
    name: 'union',
    raw: 'string | number[]',
    elements: [
      { name: 'string' },
      { name: 'Array', elements: [{ name: 'number' }], raw: 'number[]' },
    ],
  });
});
