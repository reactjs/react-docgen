import { makeMockImporter, parse } from '../../../tests/utils';
import resolveObjectValuesToArray from '../resolveObjectValuesToArray.js';
import { describe, expect, test } from 'vitest';

describe('resolveObjectValuesToArray', () => {
  const mockImporter = makeMockImporter({
    foo: (stmtLast) =>
      stmtLast(`
      export default {
        1: "bar",
        2: "foo",
        3: 0,
        4: 5,
        5: undefined,
        6: null,
        [7]: 7,
        ['foo']: "foo",
      };
    `).get('declaration'),

    bar: (stmtLast) =>
      stmtLast(`
      export default {
        bar: 'bar',
      };
    `).get('declaration'),
  });

  test('resolves Object.values with strings', () => {
    const path = parse.expressionLast(
      ['var foo = { 1: "bar", 2: "foo" };', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.values with numbers', () => {
    const path = parse.expressionLast(
      ['var foo = { 1: 0, 2: 5 };', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.values with undefined or null', () => {
    const path = parse.expressionLast(
      ['var foo = { 1: null, 2: undefined };', 'Object.values(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.values with literals as computed key', () => {
    const path = parse.expressionLast(
      ['var foo = { ["bar"]: 1, [5]: 2};', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('does not resolve Object.values with complex computed key', () => {
    const path = parse.expressionLast(
      ['var foo = { [()=>{}]: 1, [5]: 2};', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toBeNull();
  });

  test('resolves Object.values when using resolvable spread', () => {
    const path = parse.expressionLast(
      [
        'var bar = { doo: 4 }',
        'var foo = { boo: 1, foo: 2, ...bar };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.values when using getters', () => {
    const path = parse.expressionLast(
      [
        'var foo = { boo: 1, foo: 2, get bar() {} };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.values when using setters', () => {
    const path = parse.expressionLast(
      [
        'var foo = { boo: 1, foo: 2, set bar(e) {} };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.values when using methods', () => {
    const path = parse.expressionLast(
      ['var foo = { boo: 1, foo: 2, bar(e) {} };', 'Object.values(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.values but ignores duplicates', () => {
    const path = parse.expressionLast(
      [
        'var bar = { doo: 4, doo: 5 }',
        'var foo = { boo: 1, foo: 2, doo: 1, ...bar };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.values but ignores duplicates with getter and setter', () => {
    const path = parse.expressionLast(
      ['var foo = { get x() {}, set x(a) {} };', 'Object.values(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('does not resolve Object.values when using unresolvable spread', () => {
    const path = parse.expressionLast(
      ['var foo = { bar: 1, foo: 2, ...bar };', 'Object.values(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectValuesToArray(path)).toBeNull();
  });

  test('can resolve imported objects passed to Object.values', () => {
    const path = parse.expressionLast(
      `import foo from 'foo';
       Object.values(foo);`,
      mockImporter,
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('can resolve spreads from imported objects', () => {
    const path = parse.expressionLast(
      `import bar from 'bar';
       var abc = { foo: 'foo', baz: 'baz', ...bar };
       Object.values(abc);`,
      mockImporter,
    );

    expect(resolveObjectValuesToArray(path)).toMatchSnapshot();
  });

  test('can handle unresolved imported objects passed to Object.values', () => {
    const path = parse.expressionLast(
      `import foo from 'foo';
       Object.values(foo);`,
    );

    expect(resolveObjectValuesToArray(path)).toBe(null);
  });

  test('can handle unresolve spreads from imported objects', () => {
    const path = parse.expressionLast(
      `import bar from 'bar';
       var abc = { foo: 'foo', baz: 'baz', ...bar };
       Object.keys(abc);`,
    );

    expect(resolveObjectValuesToArray(path)).toBe(null);
  });

  test('can handle unresolve object value from imported objects', () => {
    const path = parse.expressionLast(
      `import bar from 'bar';
       var abc = { foo: 'foo', baz: bar };
       Object.keys(abc);`,
    );

    expect(resolveObjectValuesToArray(path)).toBe(null);
  });
});
