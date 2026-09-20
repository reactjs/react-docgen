import { getBody, hasComponentAnnotation } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('finds an adjacent component annotation', () => {
  const file = parseFile('// @component\nconst Component = () => null;');
  const [declaration] = getBody(file);

  expect(declaration && hasComponentAnnotation(file, declaration.node)).toBe(
    true,
  );
});
