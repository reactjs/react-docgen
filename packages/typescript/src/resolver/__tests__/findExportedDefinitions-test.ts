import { findExportedDefinitions } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('returns supported named and default declarations only', () => {
  const definitions = findExportedDefinitions(
    parseFile(`
      function Internal() {}
      export function Named() {}
      export default class Default {}
      class CommonJs {}
      exports.CommonJs = CommonJs;
    `),
  );

  expect(definitions.map(({ node }) => node.type)).toEqual([
    'FunctionDeclaration',
    'ClassDeclaration',
    'ClassDeclaration',
  ]);
});
