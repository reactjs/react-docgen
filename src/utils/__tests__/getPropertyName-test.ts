import type { ObjectExpression, TypeCastExpression } from '@babel/types';
import { parse, makeMockImporter } from '../../../tests/utils';
import getPropertyName from '../getPropertyName';

describe('getPropertyName', () => {
  const mockImporter = makeMockImporter({
    foo: stmtLast =>
      stmtLast(`
      export default "name";
    `).get('declaration'),

    bar: stmtLast =>
      stmtLast(`
      export default { baz: "name" };
    `).get('declaration'),
  });

  it('returns the name for a normal property', () => {
    const def = parse.expression<ObjectExpression>('{ foo: 1 }');
    const param = def.get('properties')[0];

    expect(getPropertyName(param)).toBe('foo');
  });

  it('returns the name of a object type spread property', () => {
    const def = parse.expression<TypeCastExpression>('(a: { ...foo })');
    const param = def
      .get('typeAnnotation')
      .get('typeAnnotation')
      .get('properties')[0];

    expect(getPropertyName(param)).toBe('foo');
  });

  it('returns the qualified name of a object type spread property', () => {
    const def = parse.expression<TypeCastExpression>('(a: { ...foo.bub })');
    const param = def
      .get('typeAnnotation')
      .get('typeAnnotation')
      .get('properties')[0];

    expect(getPropertyName(param)).toBe('foo.bub');
  });

  it('creates name for computed properties', () => {
    const def = parse.expression<ObjectExpression>('{ [foo]: 21 }');
    const param = def.get('properties')[0];

    expect(getPropertyName(param)).toBe('@computed#foo');
  });

  it('creates name for computed properties from string', () => {
    const def = parse.expression<ObjectExpression>('{ ["foo"]: 21 }');
    const param = def.get('properties')[0];

    expect(getPropertyName(param)).toBe('foo');
  });

  it('creates name for computed properties from int', () => {
    const def = parse.expression<ObjectExpression>('{ [31]: 21 }');
    const param = def.get('properties')[0];

    expect(getPropertyName(param)).toBe('31');
  });

  it('returns null for computed properties from regex', () => {
    const def = parse.expression<ObjectExpression>('{ [/31/]: 21 }');
    const param = def.get('properties')[0];

    expect(getPropertyName(param)).toBe(null);
  });

  it('returns null for to complex computed properties', () => {
    const def = parse.expression<ObjectExpression>('{ [() => {}]: 21 }');
    const param = def.get('properties')[0];

    expect(getPropertyName(param)).toBe(null);
  });

  it('resolves simple variables', () => {
    const def = parse.expressionLast<ObjectExpression>(`
    const foo = "name";

    ({ [foo]: 21 });
    `);
    const param = def.get('properties')[0];

    expect(getPropertyName(param)).toBe('name');
  });

  it('resolves imported variables', () => {
    const def = parse.expressionLast<ObjectExpression>(
      `
    import foo from 'foo';

    ({ [foo]: 21 });
    `,
      mockImporter,
    );
    const param = def.get('properties')[0];

    expect(getPropertyName(param)).toBe('name');
  });

  it('resolves simple member expressions', () => {
    const def = parse.expressionLast<ObjectExpression>(`
    const a = { foo: "name" };

    ({ [a.foo]: 21 });
    `);
    const param = def.get('properties')[0];

    expect(getPropertyName(param)).toBe('name');
  });

  it('resolves imported member expressions', () => {
    const def = parse.expressionLast<ObjectExpression>(
      `
    import bar from 'bar';

    ({ [bar.baz]: 21 });
    `,
      mockImporter,
    );
    const param = def.get('properties')[0];

    expect(getPropertyName(param)).toBe('name');
  });
});
