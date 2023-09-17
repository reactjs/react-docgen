import { ImportDeclaration } from '@babel/types';
import { parse } from '../../../tests/utils';
import isUnreachableFlowType from '../isUnreachableFlowType.js';
import { describe, expect, test } from 'vitest';

describe('isUnreachableFlowType', () => {
  test('considers Identifier as unreachable', () => {
    expect(isUnreachableFlowType(parse.expression('foo'))).toBe(true);
  });

  test('considers any ImportSpecifier as unreachable', () => {
    expect(
      isUnreachableFlowType(
        parse
          .statement<ImportDeclaration>('import x from "";')
          .get('specifiers')[0],
      ),
    ).toBe(true);
  });

  test('considers CallExpression as unreachable', () => {
    expect(isUnreachableFlowType(parse.expression('foo()'))).toBe(true);
  });

  test('considers VariableDeclaration not as unreachable', () => {
    expect(isUnreachableFlowType(parse.statement('const x = 1;'))).toBe(false);
  });
});
