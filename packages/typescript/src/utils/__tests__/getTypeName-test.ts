import { getBody } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';
import getTypeName from '../getTypeName.js';

test('maps supported TypeScript annotations', () => {
  const file = parseFile('type Props = { label: string; disabled: boolean };');
  const [alias] = getBody(file);
  const annotation = alias?.get('typeAnnotation');
  const members =
    annotation && !Array.isArray(annotation) ? annotation.get('members') : null;

  expect(Array.isArray(members)).toBe(true);

  if (!Array.isArray(members)) {
    return;
  }

  expect(
    members.map((member) => {
      const typeAnnotation = member.get('typeAnnotation');

      return typeAnnotation && !Array.isArray(typeAnnotation)
        ? getTypeName(typeAnnotation.node)
        : null;
    }),
  ).toEqual(['string', 'boolean']);
});
