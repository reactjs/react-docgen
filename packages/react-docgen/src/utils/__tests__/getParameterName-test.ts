import type {
  ArrayPattern,
  ClassDeclaration,
  FunctionExpression,
} from '@babel/types';
import { parse } from '../../../tests/utils';
import getParameterName from '../getParameterName';

describe('getParameterName', () => {
  it('returns the name for a normal parameter', () => {
    const def = parse.expression<FunctionExpression>('function(a) {}');
    const param = def.get('params')[0];

    expect(getParameterName(param)).toEqual('a');
  });

  it('returns the name for a rest parameter', () => {
    const def = parse.expression<FunctionExpression>('function(...a) {}');
    const param = def.get('params')[0];

    expect(getParameterName(param)).toEqual('...a');
  });

  it('returns the name for a parameter with a default value', () => {
    const def = parse.expression<FunctionExpression>('function(a = 0) {}');
    const param = def.get('params')[0];

    expect(getParameterName(param)).toEqual('a');
  });

  it('returns the raw representation for a parameter with object destructuring', () => {
    const def = parse.expression<FunctionExpression>('function({a}) {}');
    const param = def.get('params')[0];

    expect(getParameterName(param)).toEqual('{a}');
  });

  it('returns the raw representation for a parameter with array destructuring', () => {
    const def = parse.expression<FunctionExpression>('function([a]) {}');
    const param = def.get('params')[0];

    expect(getParameterName(param)).toEqual('[a]');
  });

  it('throws when passed an invalid path', () => {
    // ArrayPattern is wrong, but we test here the throwing, so we are cheating the types
    const def = parse.expression<ArrayPattern>('function() {}');

    expect(() => getParameterName(def)).toThrow();
  });

  it('handles typescript param property correctly', () => {
    const def = parse.expression<ClassDeclaration>(
      'class A { constructor(readonly a: any) {}}',
      { filename: 'file.ts' },
    );
    const param = def.get('body').get('body')[0].get('params')[0];

    expect(getParameterName(param)).toEqual('a');
  });
});
