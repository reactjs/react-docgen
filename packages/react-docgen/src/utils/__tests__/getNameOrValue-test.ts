import type { NodePath } from '@babel/traverse';
import type {
  QualifiedTypeIdentifier,
  TSAsExpression,
  TSQualifiedName,
  TypeCastExpression,
} from '@babel/types';
import { parse, parseTypescript } from '../../../tests/utils';
import getNameOrValue from '../getNameOrValue';

describe('getNameOrValue', () => {
  it('gets Identifier name', () => {
    expect(getNameOrValue(parse.expression('foo'))).toMatchSnapshot();
  });

  it('gets string literal value', () => {
    expect(getNameOrValue(parse.expression('"foo"'))).toMatchSnapshot();
  });

  it('gets numeric literal value', () => {
    expect(getNameOrValue(parse.expression('1'))).toMatchSnapshot();
  });

  it('gets boolean literal value', () => {
    expect(getNameOrValue(parse.expression('true'))).toMatchSnapshot();
  });

  it('gets null RegExp pattern', () => {
    expect(getNameOrValue(parse.expression('/abc?/'))).toMatchSnapshot();
  });

  it('gets null literal value', () => {
    expect(getNameOrValue(parse.expression('null'))).toMatchSnapshot();
  });

  it('gets TSQualifiedName', () => {
    expect(
      getNameOrValue(
        parseTypescript
          .expression<TSAsExpression>('path as x.h')
          .get('typeAnnotation.typeName') as NodePath<TSQualifiedName>,
      ),
    ).toMatchSnapshot();
  });

  it('gets QualifiedTypeIdentifier', () => {
    expect(
      getNameOrValue(
        parse
          .expression<TypeCastExpression>('path: x.h')
          .get(
            'typeAnnotation.typeAnnotation.id',
          ) as NodePath<QualifiedTypeIdentifier>,
      ),
    ).toMatchSnapshot();
  });

  it('errors on invalid path', () => {
    expect(() =>
      getNameOrValue(parse.statement<TypeCastExpression>('function foo(){}')),
    ).toThrowErrorMatchingSnapshot();
  });
});
