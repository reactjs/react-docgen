import {
  findExportedDefinitions,
  findImperativeHandleMethods,
} from '@react-docgen/core';
import { expect, test } from 'vitest';
import parseFile from '../../__tests__/testUtils.js';

test('finds methods exposed through useImperativeHandle', () => {
  const file = parseFile(`
    export const Input = forwardRef(function Input(props, ref) {
      useImperativeHandle(ref, () => ({ focus() {}, reset() {} }));
    });
  `);
  const [definition] = findExportedDefinitions(file);

  expect(definition?.node.type).toBe('FunctionExpression');
  expect(
    definition && findImperativeHandleMethods(definition.node),
  ).toHaveLength(2);
});
