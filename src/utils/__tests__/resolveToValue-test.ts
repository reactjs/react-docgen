import { builders } from 'ast-types';
import { parse, noopImporter, expressionLast } from '../../../tests/utils';
import resolveToValue from '../resolveToValue';

describe('resolveToValue', () => {
  it('resolves simple variable declarations', () => {
    const path = expressionLast(['var foo  = 42;', 'foo;'].join('\n'));
    expect(resolveToValue(path, noopImporter)).toEqualASTNode(
      builders.literal(42),
    );
  });

  it('resolves object destructuring', () => {
    const path = expressionLast(
      ['var {foo: {bar: baz}} = bar;', 'baz;'].join('\n'),
    );

    // Node should be equal to bar.foo.bar
    expect(resolveToValue(path, noopImporter)).toEqualASTNode(
      builders.memberExpression(
        builders.memberExpression(
          builders.identifier('bar'),
          builders.identifier('foo'),
        ),
        builders.identifier('bar'),
      ),
    );
  });

  it('handles SpreadElements properly', () => {
    const path = expressionLast(
      ['var {foo: {bar}, ...baz} = bar;', 'baz;'].join('\n'),
    );

    expect(resolveToValue(path, noopImporter)).toEqualASTNode(path);
  });

  it('returns the original path if it cannot be resolved', () => {
    const path = expressionLast(['function foo() {}', 'foo()'].join('\n'));

    expect(resolveToValue(path, noopImporter)).toEqualASTNode(path);
  });

  it('resolves variable declarators to their init value', () => {
    const path = parse('var foo = 42;').get('body', 0, 'declarations', 0);

    expect(resolveToValue(path, noopImporter)).toEqualASTNode(
      builders.literal(42),
    );
  });

  it('resolves to class declarations', () => {
    const path = expressionLast(`
      class Foo {}
      Foo;
    `);
    expect(resolveToValue(path, noopImporter).node.type).toBe(
      'ClassDeclaration',
    );
  });

  it('resolves to class function declaration', () => {
    const path = expressionLast(`
      function foo() {}
      foo;
    `);
    expect(resolveToValue(path, noopImporter).node.type).toBe(
      'FunctionDeclaration',
    );
  });

  describe('flow', () => {
    it('resolves type cast expressions', () => {
      const path = expressionLast(`
      function foo() {}
      (foo: any);
    `);
      expect(resolveToValue(path, noopImporter).node.type).toBe(
        'FunctionDeclaration',
      );
    });
  });

  describe('typescript', () => {
    const parseTypescript = src =>
      expressionLast(src, { parserOptions: { plugins: ['typescript'] } });

    it('resolves type as expressions', () => {
      const path = parseTypescript(`
      function foo() {}
      (foo as any);
    `);
      expect(resolveToValue(path, noopImporter).node.type).toBe(
        'FunctionDeclaration',
      );
    });

    it('resolves type assertions', () => {
      const path = parseTypescript(`
      function foo() {}
      (<any> foo);
    `);
      expect(resolveToValue(path, noopImporter).node.type).toBe(
        'FunctionDeclaration',
      );
    });
  });

  describe('assignments', () => {
    it('resolves to assigned values', () => {
      const path = expressionLast(['var foo;', 'foo = 42;', 'foo;'].join('\n'));

      expect(resolveToValue(path, noopImporter)).toEqualASTNode(
        builders.literal(42),
      );
    });

    it('resolves to other assigned value if ref is in an assignment lhs', () => {
      const path = expressionLast(
        ['var foo;', 'foo = 42;', 'foo = wrap(foo);'].join('\n'),
      );

      expect(resolveToValue(path.get('left'), noopImporter)).toEqualASTNode(
        builders.literal(42),
      );
    });

    it('resolves to other assigned value if ref is in an assignment rhs', () => {
      const path = expressionLast(
        ['var foo;', 'foo = 42;', 'foo = wrap(foo);'].join('\n'),
      );

      expect(
        resolveToValue(path.get('right', 'arguments', 0), noopImporter),
      ).toEqualASTNode(builders.literal(42));
    });
  });

  describe('ImportDeclaration', () => {
    it('resolves default import references to the import declaration', () => {
      const path = expressionLast(['import foo from "Foo"', 'foo;'].join('\n'));
      const value = resolveToValue(path, noopImporter);

      expect(Array.isArray(value.value)).toBe(false);
      expect(value.node.type).toBe('ImportDeclaration');
    });

    it('resolves named import references to the import declaration', () => {
      const path = expressionLast(
        ['import {foo} from "Foo"', 'foo;'].join('\n'),
      );
      const value = resolveToValue(path, noopImporter);

      expect(Array.isArray(value.value)).toBe(false);
      expect(value.node.type).toBe('ImportDeclaration');
    });

    it('resolves aliased import references to the import declaration', () => {
      const path = expressionLast(
        ['import {foo as bar} from "Foo"', 'bar;'].join('\n'),
      );
      const value = resolveToValue(path, noopImporter);

      expect(Array.isArray(value.value)).toBe(false);
      expect(value.node.type).toBe('ImportDeclaration');
    });

    it('resolves namespace import references to the import declaration', () => {
      const path = expressionLast(
        ['import * as bar from "Foo"', 'bar;'].join('\n'),
      );
      const value = resolveToValue(path, noopImporter);

      expect(Array.isArray(value.value)).toBe(false);
      expect(value.node.type).toBe('ImportDeclaration');
    });
  });

  describe('MemberExpression', () => {
    it("resolves a MemberExpression to it's init value", () => {
      const path = expressionLast(
        ['var foo = { bar: 1 };', 'foo.bar;'].join('\n'),
      );

      expect(resolveToValue(path, noopImporter)).toEqualASTNode(
        builders.literal(1),
      );
    });

    it('resolves a MemberExpression in the scope chain', () => {
      const path = expressionLast(
        ['var foo = 1;', 'var bar = { baz: foo };', 'bar.baz;'].join('\n'),
      );

      expect(resolveToValue(path, noopImporter)).toEqualASTNode(
        builders.literal(1),
      );
    });

    it('resolves a nested MemberExpression in the scope chain', () => {
      const path = expressionLast(
        [
          'var foo = { bar: 1 };',
          'var bar = { baz: foo.bar };',
          'bar.baz;',
        ].join('\n'),
      );

      expect(resolveToValue(path, noopImporter)).toEqualASTNode(
        builders.literal(1),
      );
    });

    it('returns the last resolvable MemberExpression', () => {
      const path = expressionLast(
        [
          'import foo from "bar";',
          'var bar = { baz: foo.bar };',
          'bar.baz;',
        ].join('\n'),
      );

      expect(resolveToValue(path, noopImporter)).toEqualASTNode(
        builders.memberExpression(
          builders.identifier('foo'),
          builders.identifier('bar'),
        ),
      );
    });

    it('returns the path itself if it can not resolve it any further', () => {
      const path = expressionLast(
        ['var foo = {};', 'foo.bar = 1;', 'foo.bar;'].join('\n'),
      );

      expect(resolveToValue(path, noopImporter)).toEqualASTNode(path);
    });
  });
});
