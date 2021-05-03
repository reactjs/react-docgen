import {
  statement,
  expression,
  noopImporter,
  makeMockImporter,
  expressionLast,
} from '../../../tests/utils';
import getPropertyName from '../getPropertyName';

describe('getPropertyName', () => {
  const mockImporter = makeMockImporter({
    foo: statement(`
      export default "name";
    `).get('declaration'),

    bar: statement(`
      export default { baz: "name" };
    `).get('declaration'),
  });

  it('returns the name for a normal property', () => {
    const def = expression('{ foo: 1 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param, noopImporter)).toBe('foo');
  });

  it('returns the name of a object type spread property', () => {
    const def = expression('(a: { ...foo })');
    const param = def.get('typeAnnotation', 'typeAnnotation', 'properties', 0);

    expect(getPropertyName(param, noopImporter)).toBe('foo');
  });

  it('creates name for computed properties', () => {
    const def = expression('{ [foo]: 21 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param, noopImporter)).toBe('@computed#foo');
  });

  it('creates name for computed properties from string', () => {
    const def = expression('{ ["foo"]: 21 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param, noopImporter)).toBe('foo');
  });

  it('creates name for computed properties from int', () => {
    const def = expression('{ [31]: 21 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param, noopImporter)).toBe('31');
  });

  it('returns null for computed properties from regex', () => {
    const def = expression('{ [/31/]: 21 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param, noopImporter)).toBe(null);
  });

  it('returns null for to complex computed properties', () => {
    const def = expression('{ [() => {}]: 21 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param, noopImporter)).toBe(null);
  });

  it('resolves simple variables', () => {
    const def = expressionLast(`
    const foo = "name";

    ({ [foo]: 21 });
    `);
    const param = def.get('properties', 0);

    expect(getPropertyName(param, noopImporter)).toBe('name');
  });

  it('resolves imported variables', () => {
    const def = expressionLast(`
    import foo from 'foo';

    ({ [foo]: 21 });
    `);
    const param = def.get('properties', 0);

    expect(getPropertyName(param, mockImporter)).toBe('name');
  });

  it('resolves simple member expressions', () => {
    const def = expressionLast(`
    const a = { foo: "name" };

    ({ [a.foo]: 21 });
    `);
    const param = def.get('properties', 0);

    expect(getPropertyName(param, noopImporter)).toBe('name');
  });

  it('resolves imported member expressions', () => {
    const def = expressionLast(`
    import bar from 'bar';

    ({ [bar.baz]: 21 });
    `);
    const param = def.get('properties', 0);

    expect(getPropertyName(param, mockImporter)).toBe('name');
  });
});
