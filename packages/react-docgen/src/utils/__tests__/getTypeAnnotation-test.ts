import type { TypeCastExpression } from '@babel/types';
import { parse } from '../../../tests/utils';
import getTypeAnnotation from '../getTypeAnnotation';

describe('getTypeAnnotation', () => {
  it('detects simple type', () => {
    const path = parse.expression<TypeCastExpression>('x: xyz');

    expect(getTypeAnnotation(path)).toEqual(
      path.get('typeAnnotation').get('typeAnnotation'),
    );
  });

  it('does not fail if no type', () => {
    const path = parse.expression('x = 0');

    expect(getTypeAnnotation(path)).toEqual(null);
  });

  it('stops at first nested type', () => {
    const path = parse.expression<TypeCastExpression>('x: ?xyz');

    expect(getTypeAnnotation(path)).toEqual(
      path.get('typeAnnotation').get('typeAnnotation'),
    );
  });
});
