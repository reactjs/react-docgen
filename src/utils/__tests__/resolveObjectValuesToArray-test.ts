import { builders } from 'ast-types';
import {
  statement,
  noopImporter,
  makeMockImporter,
  expressionLast,
} from '../../../tests/utils';
import resolveObjectValuesToArray from '../resolveObjectValuesToArray';

describe('resolveObjectValuesToArray', () => {
  const mockImporter = makeMockImporter({
    foo: statement(`
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

    bar: statement(`
      export default {
        bar: 'bar',
      };
    `).get('declaration'),
  });

  it('resolves Object.values with strings', () => {
    const path = expressionLast(
      ['var foo = { 1: "bar", 2: "foo" };', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('bar'),
        builders.literal('foo'),
      ]),
    );
  });

  it('resolves Object.values with numbers', () => {
    const path = expressionLast(
      ['var foo = { 1: 0, 2: 5 };', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([builders.literal(0), builders.literal(5)]),
    );
  });

  it('resolves Object.values with undefined or null', () => {
    const path = expressionLast(
      ['var foo = { 1: null, 2: undefined };', 'Object.values(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectValuesToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal(null),
        builders.literal(null),
      ]),
    );
  });

  it('resolves Object.values with literals as computed key', () => {
    const path = expressionLast(
      ['var foo = { ["bar"]: 1, [5]: 2};', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([builders.literal(2), builders.literal(1)]),
    );
  });

  it('does not resolve Object.values with complex computed key', () => {
    const path = expressionLast(
      ['var foo = { [()=>{}]: 1, [5]: 2};', 'Object.values(foo);'].join('\n'),
    );

    expect(resolveObjectValuesToArray(path, noopImporter)).toBeNull();
  });

  it('resolves Object.values when using resolvable spread', () => {
    const path = expressionLast(
      [
        'var bar = { doo: 4 }',
        'var foo = { boo: 1, foo: 2, ...bar };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal(1),
        builders.literal(4),
        builders.literal(2),
      ]),
    );
  });

  it('resolves Object.values when using getters', () => {
    const path = expressionLast(
      [
        'var foo = { boo: 1, foo: 2, get bar() {} };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([builders.literal(1), builders.literal(2)]),
    );
  });

  it('resolves Object.values when using setters', () => {
    const path = expressionLast(
      [
        'var foo = { boo: 1, foo: 2, set bar(e) {} };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([builders.literal(1), builders.literal(2)]),
    );
  });

  it('resolves Object.values but ignores duplicates', () => {
    const path = expressionLast(
      [
        'var bar = { doo: 4, doo: 5 }',
        'var foo = { boo: 1, foo: 2, doo: 1, ...bar };',
        'Object.values(foo);',
      ].join('\n'),
    );

    expect(resolveObjectValuesToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal(1),
        builders.literal(5),
        builders.literal(2),
      ]),
    );
  });

  it('resolves Object.values but ignores duplicates with getter and setter', () => {
    const path = expressionLast(
      ['var foo = { get x() {}, set x(a) {} };', 'Object.values(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectValuesToArray(path, noopImporter)).toEqualASTNode(
      builders.arrayExpression([]),
    );
  });

  it('does not resolve Object.values when using unresolvable spread', () => {
    const path = expressionLast(
      ['var foo = { bar: 1, foo: 2, ...bar };', 'Object.values(foo);'].join(
        '\n',
      ),
    );

    expect(resolveObjectValuesToArray(path, noopImporter)).toBeNull();
  });

  it('can resolve imported objects passed to Object.values', () => {
    const path = expressionLast(`
      import foo from 'foo';
      Object.values(foo);
    `);

    expect(resolveObjectValuesToArray(path, mockImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('bar'),
        builders.literal('foo'),
        builders.literal(0),
        builders.literal(5),
        builders.literal(null),
        builders.literal(null),
        builders.literal(7),
        builders.literal('foo'),
      ]),
    );
  });

  it('can resolve spreads from imported objects', () => {
    const path = expressionLast(`
      import bar from 'bar';
      var abc = { foo: 'foo', baz: 'baz', ...bar };
      Object.values(abc);
    `);

    expect(resolveObjectValuesToArray(path, mockImporter)).toEqualASTNode(
      builders.arrayExpression([
        builders.literal('bar'),
        builders.literal('baz'),
        builders.literal('foo'),
      ]),
    );
  });
});
