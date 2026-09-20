import { getBody, getDescription } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('returns only adjacent JSDoc descriptions', () => {
  const file = parseFile(
    '/** Component description. */\nexport function View() {}',
  );
  const [declaration] = getBody(file);

  expect(declaration).toBeDefined();

  if (declaration) {
    expect(getDescription(file, declaration.node)).toBe(
      'Component description.',
    );
  }
});
