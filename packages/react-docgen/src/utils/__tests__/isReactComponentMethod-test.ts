import type { ClassDeclaration, ObjectExpression } from '@babel/types';
import { parse, makeMockImporter } from '../../../tests/utils';
import isReactComponentMethod from '../isReactComponentMethod.js';
import { describe, expect, test } from 'vitest';

describe('isReactComponentMethod', () => {
  const mockImporter = makeMockImporter({
    foo: stmtLast =>
      stmtLast(`
      export default 'render';
    `).get('declaration'),
  });

  test('returns true if the method is a component class method', () => {
    const def = parse.statement<ClassDeclaration>('class Foo { render() {}}');
    const method = def.get('body').get('body')[0];

    expect(isReactComponentMethod(method)).toBe(true);
  });

  test('returns true if the method is a component `createClass` object method', () => {
    const def = parse.expression<ObjectExpression>('{ render() {}}');
    const method = def.get('properties')[0];

    expect(isReactComponentMethod(method)).toBe(true);
  });

  test('returns true if the method is a component `createClass` object property with arrow function', () => {
    const def = parse.expression<ObjectExpression>('{ render: () => {}}');
    const method = def.get('properties')[0];

    expect(isReactComponentMethod(method)).toBe(true);
  });

  test('returns true if the method is a component `createClass` object property with function', () => {
    const def = parse.expression<ObjectExpression>('{ render: function () {}}');
    const method = def.get('properties')[0];

    expect(isReactComponentMethod(method)).toBe(true);
  });

  test('returns false if the method is not a component class method', () => {
    const def = parse.statement<ClassDeclaration>('class Foo { bar() {}}');
    const method = def.get('body').get('body')[0];

    expect(isReactComponentMethod(method)).toBe(false);
  });

  test('returns false if the method is not a component `createClass` object method', () => {
    const def = parse.expression('{ bar() {}}');
    const method = def.get('properties')[0];

    expect(isReactComponentMethod(method)).toBe(false);
  });

  test('returns false if the path is not a method or object property', () => {
    const def = parse.statement('let foo = "bar";');

    expect(isReactComponentMethod(def)).toBe(false);
  });

  test('resolves imported value of computed property', () => {
    const def = parse.statement<ClassDeclaration>(
      `
      class Foo { [foo]() {}}
      import foo from 'foo';
    `,
      mockImporter,
    );
    const method = def.get('body').get('body')[0];

    expect(isReactComponentMethod(method)).toBe(true);
  });
});
