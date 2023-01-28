import { makeMockImporter, parse } from '../../../tests/utils';
import resolveObjectKeysToArray from '../resolveObjectKeysToArray.js';
import { describe, expect, test } from 'vitest';

describe('resolveObjectKeysToArray', () => {
  const mockImporter = makeMockImporter({
    foo: (stmtLast) =>
      stmtLast(`
      export default {
        bar: "bar",
        "foo": "foo",
        1: 0,
        2: 5,
        [3]: 3,
        ['baz']: "baz",
      };
    `).get('declaration'),

    bar: (stmtLast) =>
      stmtLast(`
      export default {
        bar: 'bar',
      };
    `).get('declaration'),
  });

  test('resolves Object.keys with identifiers', () => {
    const path = parse.expressionLast(
      ['var foo = { bar: 1, foo: 2 };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.keys with literals', () => {
    const path = parse.expressionLast(
      ['var foo = { "bar": 1, 5: 2 };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.keys with literals as computed key', () => {
    const path = parse.expressionLast(
      ['var foo = { ["bar"]: 1, [5]: 2};', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.keys when using resolvable spread', () => {
    const path = parse.expressionLast(
      [
        'var bar = { doo: 4 }',
        'var foo = { boo: 1, foo: 2, ...bar };',
        'Object.keys(foo);',
      ].join('\n'),
    );

    expect(resolveObjectKeysToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.keys when using getters', () => {
    const path = parse.expressionLast(
      ['var foo = { boo: 1, foo: 2, get bar() {} };', 'Object.keys(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectKeysToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.keys when using setters', () => {
    const path = parse.expressionLast(
      [
        'var foo = { boo: 1, foo: 2, set bar(e) {} };',
        'Object.keys(foo);',
      ].join('\n'),
    );

    expect(resolveObjectKeysToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.keys but ignores duplicates', () => {
    const path = parse.expressionLast(
      [
        'var bar = { doo: 4, doo: 5 }',
        'var foo = { boo: 1, foo: 2, doo: 1, ...bar };',
        'Object.keys(foo);',
      ].join('\n'),
    );

    expect(resolveObjectKeysToArray(path)).toMatchSnapshot();
  });

  test('resolves Object.keys but ignores duplicates with getter and setter', () => {
    const path = parse.expressionLast(
      ['var foo = { get x() {}, set x(a) {} };', 'Object.keys(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectKeysToArray(path)).toMatchSnapshot();
  });

  test('does not resolve Object.keys when using unresolvable spread', () => {
    const path = parse.expressionLast(
      ['var foo = { bar: 1, foo: 2, ...bar };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path)).toBeNull();
  });

  test('does not resolve Object.keys when using computed keys', () => {
    const path = parse.expressionLast(
      ['var foo = { [bar]: 1, foo: 2 };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path)).toBeNull();
  });

  test('can resolve imported objects passed to Object.keys', () => {
    const path = parse.expressionLast(
      `import foo from 'foo';
       Object.keys(foo);`,
      mockImporter,
    );

    expect(resolveObjectKeysToArray(path)).toMatchSnapshot();
  });

  test('can resolve spreads from imported objects', () => {
    const path = parse.expressionLast(
      `import bar from 'bar';
       var abc = { foo: 'foo', baz: 'baz', ...bar };
       Object.keys(abc);`,
      mockImporter,
    );

    expect(resolveObjectKeysToArray(path)).toMatchSnapshot();
  });
});
