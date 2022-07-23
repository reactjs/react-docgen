import type { ClassDeclaration, ObjectExpression } from '@babel/types';
import { parse, makeMockImporter } from '../../../tests/utils';
import isReactComponentMethod from '../isReactComponentMethod';

describe('isReactComponentMethod', () => {
  const mockImporter = makeMockImporter({
    foo: stmtLast =>
      stmtLast(`
      export default 'render';
    `).get('declaration'),
  });

  it('returns true if the method is a component class method', () => {
    const def = parse.statement<ClassDeclaration>('class Foo { render() {}}');
    const method = def.get('body').get('body')[0];
    expect(isReactComponentMethod(method)).toBe(true);
  });

  it('returns true if the method is a component `createClass` object method', () => {
    const def = parse.expression<ObjectExpression>('{ render() {}}');
    const method = def.get('properties')[0];
    expect(isReactComponentMethod(method)).toBe(true);
  });

  it('returns false if the method is not a component class method', () => {
    const def = parse.statement<ClassDeclaration>('class Foo { bar() {}}');
    const method = def.get('body').get('body')[0];
    expect(isReactComponentMethod(method)).toBe(false);
  });

  it('returns false if the method is not a component `createClass` object method', () => {
    const def = parse.expression('{ bar() {}}');
    const method = def.get('properties')[0];
    expect(isReactComponentMethod(method)).toBe(false);
  });

  it('returns false if the path is not a method or object property', () => {
    const def = parse.statement('let foo = "bar";');
    expect(isReactComponentMethod(def)).toBe(false);
  });

  it('resolves imported value of computed property', () => {
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
