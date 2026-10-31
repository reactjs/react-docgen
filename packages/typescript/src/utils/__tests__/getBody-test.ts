import { getBody } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('returns program body paths', () => {
  const body = getBody(parseFile('const first = 1; const second = 2;'));

  expect(body.map(({ node }) => node.type)).toEqual([
    'VariableDeclaration',
    'VariableDeclaration',
  ]);
});
