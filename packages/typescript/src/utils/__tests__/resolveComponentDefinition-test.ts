import { getBody, resolveComponentDefinition } from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('resolves nested configured HOCs to their component', () => {
  const file = parseFile(`
    function View() {}
    export default outer({ enabled: true }, inner('option', View));
  `);
  const exportPath = getBody(file).at(-1);
  const declaration = exportPath?.get('declaration');

  expect(
    declaration && !Array.isArray(declaration)
      ? resolveComponentDefinition(file, declaration)?.node.type
      : null,
  ).toBe('FunctionDeclaration');
});
