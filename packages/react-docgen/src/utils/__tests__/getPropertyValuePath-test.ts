import type { NodePath } from '@babel/traverse';
import type { ExpressionStatement, ObjectExpression } from '@babel/types';
import { parse, makeMockImporter } from '../../../tests/utils';
import getPropertyValuePath from '../getPropertyValuePath.js';
import { describe, expect, test } from 'vitest';

describe('getPropertyValuePath', () => {
  const mockImporter = makeMockImporter({
    bar: (stmt) => stmt(`export default 'bar';`).get('declaration'),
  });

  test('returns the value path if the property exists', () => {
    const objectExpressionPath = parse
      .statement<ExpressionStatement>('({foo: 21, bar: 42})')
      .get('expression') as NodePath<ObjectExpression>;

    expect(getPropertyValuePath(objectExpressionPath, 'bar')).toBe(
      objectExpressionPath.get('properties')[1].get('value'),
    );
  });

  test('returns the value path for a computed property in scope', () => {
    const objectExpressionPath = parse
      .statement<ExpressionStatement>(
        `
      ({foo: 21, [a]: 42});
      var a = 'bar';
    `,
      )
      .get('expression') as NodePath<ObjectExpression>;

    expect(getPropertyValuePath(objectExpressionPath, 'bar')).toBe(
      objectExpressionPath.get('properties')[1].get('value'),
    );
  });

  test('returns undefined if the property does not exist', () => {
    const objectExpressionPath = parse
      .statement<ExpressionStatement>('({foo: 21, bar: 42})')
      .get('expression') as NodePath<ObjectExpression>;

    expect(getPropertyValuePath(objectExpressionPath, 'baz')).toBeNull();
  });

  test('returns the value path for a computed property that was imported', () => {
    const objectExpressionPath = parse
      .statement<ExpressionStatement>(
        `
      ({foo: 21, [a]: 42});
      import a from 'bar';
    `,
        mockImporter,
      )
      .get('expression') as NodePath<ObjectExpression>;

    expect(getPropertyValuePath(objectExpressionPath, 'bar')).toBe(
      objectExpressionPath.get('properties')[1].get('value'),
    );
  });

  test('returns ObjectMethod directly', () => {
    const objectExpressionPath = parse
      .statement<ExpressionStatement>('({ foo(){} })')
      .get('expression') as NodePath<ObjectExpression>;

    expect(getPropertyValuePath(objectExpressionPath, 'foo')).toBe(
      objectExpressionPath.get('properties')[0],
    );
  });
});
