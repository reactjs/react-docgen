import type { NodePath } from '@babel/traverse';
import type {
  QualifiedTypeIdentifier,
  TSAsExpression,
  TSQualifiedName,
  TypeCastExpression,
} from '@babel/types';
import { parse, parseTypescript } from '../../../tests/utils';
import getNameOrValue from '../getNameOrValue.js';
import { describe, expect, test } from 'vitest';

describe('getNameOrValue', () => {
  test('gets Identifier name', () => {
    expect(getNameOrValue(parse.expression('foo'))).toMatchSnapshot();
  });

  test('gets string literal value', () => {
    expect(getNameOrValue(parse.expression('"foo"'))).toMatchSnapshot();
  });

  test('gets numeric literal value', () => {
    expect(getNameOrValue(parse.expression('1'))).toMatchSnapshot();
  });

  test('gets boolean literal value', () => {
    expect(getNameOrValue(parse.expression('true'))).toMatchSnapshot();
  });

  test('gets null RegExp pattern', () => {
    expect(getNameOrValue(parse.expression('/abc?/'))).toMatchSnapshot();
  });

  test('gets null literal value', () => {
    expect(getNameOrValue(parse.expression('null'))).toMatchSnapshot();
  });

  test('gets TSQualifiedName', () => {
    expect(
      getNameOrValue(
        parseTypescript
          .expression<TSAsExpression>('path as x.h')
          .get('typeAnnotation.typeName') as NodePath<TSQualifiedName>,
      ),
    ).toMatchSnapshot();
  });

  test('gets QualifiedTypeIdentifier', () => {
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

  test('errors on invalid path', () => {
    expect(() =>
      getNameOrValue(parse.statement<TypeCastExpression>('function foo(){}')),
    ).toThrowErrorMatchingSnapshot();
  });
});
