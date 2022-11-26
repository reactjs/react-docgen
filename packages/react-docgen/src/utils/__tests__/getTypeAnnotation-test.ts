import type { TypeCastExpression } from '@babel/types';
import { parse } from '../../../tests/utils';
import getTypeAnnotation from '../getTypeAnnotation.js';
import { describe, expect, test } from 'vitest';

describe('getTypeAnnotation', () => {
  test('detects simple type', () => {
    const path = parse.expression<TypeCastExpression>('x: xyz');

    expect(getTypeAnnotation(path)).toEqual(
      path.get('typeAnnotation').get('typeAnnotation'),
    );
  });

  test('does not fail if no type', () => {
    const path = parse.expression('x = 0');

    expect(getTypeAnnotation(path)).toEqual(null);
  });

  test('stops at first nested type', () => {
    const path = parse.expression<TypeCastExpression>('x: ?xyz');

    expect(getTypeAnnotation(path)).toEqual(
      path.get('typeAnnotation').get('typeAnnotation'),
    );
  });
});
