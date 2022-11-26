import type { MemberExpression } from '@babel/types';
import { parse } from '../../../tests/utils';
import getMemberExpressionRoot from '../getMemberExpressionRoot.js';
import { describe, expect, test } from 'vitest';

describe('getMemberExpressionRoot', () => {
  test('returns the root of a member expression', () => {
    const root = getMemberExpressionRoot(parse.expression('foo.bar.baz'));

    expect(root).toMatchSnapshot();
  });

  test('returns the same path if identifier', () => {
    const id = parse.expression<MemberExpression>('foo');
    const root = getMemberExpressionRoot(id);

    expect(root).toMatchSnapshot();
  });

  test('returns the same path if literal', () => {
    const literal = parse.expression<MemberExpression>('1');
    const root = getMemberExpressionRoot(literal);

    expect(root).toMatchSnapshot();
  });
});
