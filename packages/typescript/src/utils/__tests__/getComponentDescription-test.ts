import {
  findExportedDefinitions,
  getComponentDescription,
} from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('reads the docblock above a wrapped variable component', () => {
  const file = parseFile(`
    /** Wrapped component. */
    const Component = memo(forwardRef(() => null));
    export default Component;
  `);
  const [definition] = findExportedDefinitions(file);

  expect(definition && getComponentDescription(file, definition)).toBe(
    'Wrapped component.',
  );
});
