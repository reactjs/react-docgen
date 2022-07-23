import type { NodePath } from '@babel/traverse';
import type { ExpressionStatement } from '@babel/types';
import { parse } from '../../../tests/utils';
import printValue from '../printValue';

describe('printValue', () => {
  function pathFromSource(source: string): NodePath {
    return parse.statement<ExpressionStatement>(source).get('expression');
  }

  it('does not print leading comments', () => {
    expect(printValue(pathFromSource('//foo\nbar'))).toEqual('bar');
  });

  it('does not print trailing comments', () => {
    expect(printValue(pathFromSource('bar//foo'))).toEqual('bar');
  });
});
