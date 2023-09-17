import type { NodePath } from '@babel/traverse';
import type {
  AssignmentExpression,
  CallExpression,
  Identifier,
  ExportNamedDeclaration,
} from '@babel/types';
import { makeMockImporter, parse, parseTypescript } from '../../../tests/utils';
import resolveToValue from '../resolveToValue.js';
import { describe, expect, test } from 'vitest';

describe('resolveToValue', () => {
  const mockImporter = makeMockImporter({
    Foo: (stmtLast) =>
      stmtLast<ExportNamedDeclaration>(`
        const baz = 3;
        export { baz };
      `)
        .get('specifiers')[0]
        .get('local') as NodePath,
  });

  test('resolves simple variable declarations', () => {
    const path = parse.expressionLast(['var foo  = 42;', 'foo;'].join('\n'));

    expect(resolveToValue(path)).toMatchSnapshot();
  });

  test('resolves object destructuring', () => {
    const path = parse.expressionLast(
      ['var {foo: {bar: baz}} = bar;', 'baz;'].join('\n'),
    );

    expect(resolveToValue(path)).toMatchSnapshot();
  });

  test('handles RestElements properly', () => {
    const path = parse.expressionLast(
      ['var {foo: {bar}, ...baz} = bar;', 'baz;'].join('\n'),
    );

    expect(resolveToValue(path)).toMatchSnapshot();
  });

  test('returns the original path if it cannot be resolved', () => {
    const path = parse.expressionLast(
      ['function foo() {}', 'foo()'].join('\n'),
    );

    expect(resolveToValue(path)).toBe(path);
  });

  test('resolves variable declarators to their init value', () => {
    const path = parse.statement('var foo = 42;').get('declarations')[0];

    expect(resolveToValue(path)).toMatchSnapshot();
  });

  test('resolves to class declarations', () => {
    const path = parse.expressionLast(`
      class Foo {}
      Foo;
    `);

    expect(resolveToValue(path).node.type).toBe('ClassDeclaration');
  });

  test('resolves to class function declaration', () => {
    const path = parse.expressionLast(`
      function foo() {}
      foo;
    `);

    expect(resolveToValue(path).node.type).toBe('FunctionDeclaration');
  });

  describe('flow', () => {
    test('resolves type cast expressions', () => {
      const path = parse.expressionLast(`
      function foo() {}
      (foo: any);
    `);

      expect(resolveToValue(path).node.type).toBe('FunctionDeclaration');
    });
  });

  describe('typescript', () => {
    test('resolves type as expressions', () => {
      const path = parseTypescript.expressionLast(`
      function foo() {}
      (foo as any);
    `);

      expect(resolveToValue(path).node.type).toBe('FunctionDeclaration');
    });

    test('resolves type assertions', () => {
      const path = parseTypescript.expressionLast(`
      function foo() {}
      (<any> foo);
    `);

      expect(resolveToValue(path).node.type).toBe('FunctionDeclaration');
    });

    test('resolves type alias', () => {
      const path = parseTypescript.statement(
        `let action: Action;
         type Action = {};`,
      );

      expect(
        resolveToValue(
          path.get(
            'declarations.0.id.typeAnnotation.typeAnnotation.typeName',
          ) as NodePath,
        ).node.type,
      ).toBe('TSTypeAliasDeclaration');
    });
  });

  describe('assignments', () => {
    test('resolves to assigned values', () => {
      const path = parse.expressionLast(
        ['var foo;', 'foo = 42;', 'foo;'].join('\n'),
      );

      expect(resolveToValue(path)).toMatchSnapshot();
    });

    test('resolves to other assigned value if ref is in an assignment lhs', () => {
      const path = parse.expressionLast<AssignmentExpression>(
        ['var foo;', 'foo = 42;', 'foo = wrap(foo);'].join('\n'),
      );

      expect(resolveToValue(path.get('left'))).toMatchSnapshot();
    });

    test('resolves to other assigned value if ref is in an assignment rhs', () => {
      const path = parse.expressionLast<AssignmentExpression>(
        ['var foo;', 'foo = 42;', 'foo = wrap(foo);'].join('\n'),
      );

      expect(
        resolveToValue(
          (path.get('right') as NodePath<CallExpression>).get('arguments')[0],
        ),
      ).toMatchSnapshot();
    });
  });

  describe('ImportDeclaration', () => {
    test('resolves unresolvable default import references to the import declaration', () => {
      const path = parse.expressionLast<Identifier>(
        ['import foo from "Foo"', 'foo;'].join('\n'),
      );
      const value = resolveToValue(path);

      expect(value.node.type).toBe('ImportDefaultSpecifier');
    });

    test('resolves unresolvable named import references to the import declaration', () => {
      const path = parse.expressionLast(
        ['import {foo} from "Foo"', 'foo;'].join('\n'),
      );
      const value = resolveToValue(path);

      expect(value.node.type).toBe('ImportSpecifier');
    });

    test('resolves unresolvable aliased import references to the import declaration', () => {
      const path = parse.expressionLast(
        ['import {foo as bar} from "Foo"', 'bar;'].join('\n'),
      );
      const value = resolveToValue(path);

      expect(value.node.type).toBe('ImportSpecifier');
    });

    test('resolves unresolvable namespace import references to the import declaration', () => {
      const path = parse.expressionLast(
        ['import * as bar from "Foo"', 'bar;'].join('\n'),
      );
      const value = resolveToValue(path);

      expect(value.node.type).toBe('ImportNamespaceSpecifier');
    });

    test('resolves namespace import references to the import declaration', () => {
      const path = parse.expressionLast(
        `import * as bar from "Foo"; bar.baz`,
        mockImporter,
      );
      const value = resolveToValue(path);

      expect(value).toMatchSnapshot();
    });

    test('resolves namespace import references to the import declaration', () => {
      const path = parse.expressionLast(
        `import * as bar from "Foo"; bar['baz']`,
        mockImporter,
      );
      const value = resolveToValue(path);

      expect(value).toMatchSnapshot();
    });

    test('does not crash when resolving MemberExpression with non Identifiers', () => {
      const path = parse.expressionLast(
        `import * as bar from "Foo"; bar[()=>{}]`,
        mockImporter,
      );
      const value = resolveToValue(path);

      expect(value).toMatchSnapshot();
    });
  });

  describe('MemberExpression', () => {
    test("resolves a MemberExpression to it's init value", () => {
      const path = parse.expressionLast(
        ['var foo = { bar: 1 };', 'foo.bar;'].join('\n'),
      );

      expect(resolveToValue(path)).toMatchSnapshot();
    });

    test('resolves a MemberExpression in the scope chain', () => {
      const path = parse.expressionLast(
        ['var foo = 1;', 'var bar = { baz: foo };', 'bar.baz;'].join('\n'),
      );

      expect(resolveToValue(path)).toMatchSnapshot();
    });

    test('resolves a nested MemberExpression in the scope chain', () => {
      const path = parse.expressionLast(
        [
          'var foo = { bar: 1 };',
          'var bar = { baz: foo.bar };',
          'bar.baz;',
        ].join('\n'),
      );

      expect(resolveToValue(path)).toMatchSnapshot();
    });

    test('returns the last resolvable MemberExpression', () => {
      const path = parse.expressionLast(
        [
          'import foo from "bar";',
          'var bar = { baz: foo.bar };',
          'bar.baz;',
        ].join('\n'),
      );

      expect(resolveToValue(path)).toMatchSnapshot();
    });

    test('returns the path itself if it can not resolve it any further', () => {
      const path = parse.expressionLast(
        `var foo = {};
        foo.bar = 1;
        foo.bar;`,
      );

      expect(resolveToValue(path)).toBe(path);
    });
  });
});
