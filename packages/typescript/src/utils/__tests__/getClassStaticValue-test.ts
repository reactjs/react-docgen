import { expect, test } from 'vitest';
import {
  findExportedDefinitions,
  getClassStaticValue,
  isLiteral,
} from '@react-docgen/core';
import parseFile from '../../__tests__/testUtils.js';

test('resolves a static getter return value', () => {
  const file = parseFile(
    'const name = "Button"; export default class View { static get displayName() { return name; } }',
  );
  const [definition] = findExportedDefinitions(file);
  const value = definition
    ? getClassStaticValue(file, definition, 'displayName')
    : null;

  expect(value && isLiteral(value) ? value.value : null).toBe('Button');
});
