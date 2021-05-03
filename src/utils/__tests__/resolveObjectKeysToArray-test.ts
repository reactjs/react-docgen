import { builders } from 'ast-types';
import {
  statement,
  noopImporter,
  makeMockImporter,
  expressionLast,
} from '../../../tests/utils';
import resolveObjectKeysToArray from '../resolveObjectKeysToArray';

describe('resolveObjectKeysToArray', () => {
  const mockImporter = makeMockImporter({
    foo: statement(`
      export default {
        bar: "bar",
        "foo": "foo",
        1: 0,
        2: 5,
        [3]: 3,
        ['baz']: "baz",
      };
    `).get('declaration'),

    bar: statement(`
      export default {
        bar: 'bar',
      };
    `).get('declaration'),
  });

  it('resolves Object.keys with identifiers', () => {
    const path = expressionLast(
      ['var foo = { bar: 1, foo: 2 };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('bar'),
        builders.literal('foo'),
      ]),
    );
  });

  it('resolves Object.keys with literals', () => {
    const path = expressionLast(
      ['var foo = { "bar": 1, 5: 2 };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('bar'),
        builders.literal('5'),
      ]),
    );
  });

  it('resolves Object.keys with literals as computed key', () => {
    const path = expressionLast(
      ['var foo = { ["bar"]: 1, [5]: 2};', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('bar'),
        builders.literal('5'),
      ]),
    );
  });

  it('resolves Object.keys when using resolvable spread', () => {
    const path = expressionLast(
      [
        'var bar = { doo: 4 }',
        'var foo = { boo: 1, foo: 2, ...bar };',
        'Object.keys(foo);',
      ].join('\n'),
    );

    expect(resolveObjectKeysToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('boo'),
        builders.literal('foo'),
        builders.literal('doo'),
      ]),
    );
  });

  it('resolves Object.keys when using getters', () => {
    const path = expressionLast(
      ['var foo = { boo: 1, foo: 2, get bar() {} };', 'Object.keys(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectKeysToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('boo'),
        builders.literal('foo'),
        builders.literal('bar'),
      ]),
    );
  });

  it('resolves Object.keys when using setters', () => {
    const path = expressionLast(
      [
        'var foo = { boo: 1, foo: 2, set bar(e) {} };',
        'Object.keys(foo);',
      ].join('\n'),
    );

    expect(resolveObjectKeysToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('boo'),
        builders.literal('foo'),
        builders.literal('bar'),
      ]),
    );
  });

  it('resolves Object.keys but ignores duplicates', () => {
    const path = expressionLast(
      [
        'var bar = { doo: 4, doo: 5 }',
        'var foo = { boo: 1, foo: 2, doo: 1, ...bar };',
        'Object.keys(foo);',
      ].join('\n'),
    );

    expect(resolveObjectKeysToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('boo'),
        builders.literal('foo'),
        builders.literal('doo'),
      ]),
    );
  });

  it('resolves Object.keys but ignores duplicates with getter and setter', () => {
    const path = expressionLast(
      ['var foo = { get x() {}, set x(a) {} };', 'Object.keys(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectKeysToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([builders.literal('x')]),
    );
  });

  it('does not resolve Object.keys when using unresolvable spread', () => {
    const path = expressionLast(
      ['var foo = { bar: 1, foo: 2, ...bar };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path, noopImporter)).toBeNull();
  });

  it('does not resolve Object.keys when using computed keys', () => {
    const path = expressionLast(
      ['var foo = { [bar]: 1, foo: 2 };', 'Object.keys(foo);'].join('\n'),
    );

    expect(resolveObjectKeysToArray(path, noopImporter)).toBeNull();
  });

  it('can resolve imported objects passed to Object.keys', () => {
    const path = expressionLast(`
      import foo from 'foo';
      Object.keys(foo);
    `);

    expect(resolveObjectKeysToArray(path, mockImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('bar'),
        builders.literal('foo'),
        builders.literal(1),
        builders.literal(2),
        builders.literal(3),
        builders.literal('baz'),
      ]),
    );
  });

  it('can resolve spreads from imported objects', () => {
    const path = expressionLast(`
      import bar from 'bar';
      var abc = { foo: 'foo', baz: 'baz', ...bar };
      Object.keys(abc);
    `);

    expect(resolveObjectKeysToArray(path, mockImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('foo'),
        builders.literal('baz'),
        builders.literal('bar'),
      ]),
    );
  });
});
