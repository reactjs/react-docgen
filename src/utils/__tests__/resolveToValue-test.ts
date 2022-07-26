import type { NodePath } from '@babel/traverse';
import {
  identifier,
  memberExpression,
  numericLiteral,
  objectProperty,
  restElement,
} from '@babel/types';
import type {
  AssignmentExpression,
  CallExpression,
  Identifier,
} from '@babel/types';
import { parse, parseTypescript } from '../../../tests/utils';
import resolveToValue from '../resolveToValue';

describe('resolveToValue', () => {
  it('resolves simple variable declarations', () => {
    const path = parse.expressionLast(['var foo  = 42;', 'foo;'].join('\n'));

    expect(resolveToValue(path)).toEqualASTNode(numericLiteral(42));
  });

  it('resolves object destructuring', () => {
    const path = parse.expressionLast(
      ['var {foo: {bar: baz}} = bar;', 'baz;'].join('\n'),
    );

    const expected = objectProperty(
      identifier('bar'),
      identifier('baz'),
      undefined,
      undefined,
      undefined,
    );

    expected.decorators = undefined;
    // @ts-ignore BABEL types bug
    expected.method = false;
    // Resolves to identifier in destructuring
    expect(resolveToValue(path)).toEqualASTNode(expected);
  });

  it('handles RestElements properly', () => {
    const path = parse.expressionLast(
      ['var {foo: {bar}, ...baz} = bar;', 'baz;'].join('\n'),
    );

    expect(resolveToValue(path)).toEqualASTNode(restElement(identifier('baz')));
  });

  it('returns the original path if it cannot be resolved', () => {
    const path = parse.expressionLast(
      ['function foo() {}', 'foo()'].join('\n'),
    );

    expect(resolveToValue(path)).toEqualASTNode(path);
  });

  it('resolves variable declarators to their init value', () => {
    const path = parse.statement('var foo = 42;').get('declarations')[0];

    expect(resolveToValue(path)).toEqualASTNode(numericLiteral(42));
  });

  it('resolves to class declarations', () => {
    const path = parse.expressionLast(`
      class Foo {}
      Foo;
    `);

    expect(resolveToValue(path).node.type).toBe('ClassDeclaration');
  });

  it('resolves to class function declaration', () => {
    const path = parse.expressionLast(`
      function foo() {}
      foo;
    `);

    expect(resolveToValue(path).node.type).toBe('FunctionDeclaration');
  });

  describe('flow', () => {
    it('resolves type cast expressions', () => {
      const path = parse.expressionLast(`
      function foo() {}
      (foo: any);
    `);

      expect(resolveToValue(path).node.type).toBe('FunctionDeclaration');
    });
  });

  describe('typescript', () => {
    it('resolves type as expressions', () => {
      const path = parseTypescript.expressionLast(`
      function foo() {}
      (foo as any);
    `);

      expect(resolveToValue(path).node.type).toBe('FunctionDeclaration');
    });

    it('resolves type assertions', () => {
      const path = parseTypescript.expressionLast(`
      function foo() {}
      (<any> foo);
    `);

      expect(resolveToValue(path).node.type).toBe('FunctionDeclaration');
    });

    it('resolves type alias', () => {
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
    it('resolves to assigned values', () => {
      const path = parse.expressionLast(
        ['var foo;', 'foo = 42;', 'foo;'].join('\n'),
      );

      expect(resolveToValue(path)).toEqualASTNode(numericLiteral(42));
    });

    it('resolves to other assigned value if ref is in an assignment lhs', () => {
      const path = parse.expressionLast<AssignmentExpression>(
        ['var foo;', 'foo = 42;', 'foo = wrap(foo);'].join('\n'),
      );

      expect(resolveToValue(path.get('left'))).toEqualASTNode(
        numericLiteral(42),
      );
    });

    it('resolves to other assigned value if ref is in an assignment rhs', () => {
      const path = parse.expressionLast<AssignmentExpression>(
        ['var foo;', 'foo = 42;', 'foo = wrap(foo);'].join('\n'),
      );

      expect(
        resolveToValue(
          (path.get('right') as NodePath<CallExpression>).get('arguments')[0],
        ),
      ).toEqualASTNode(numericLiteral(42));
    });
  });

  describe('ImportDeclaration', () => {
    it('resolves default import references to the import declaration', () => {
      const path = parse.expressionLast<Identifier>(
        ['import foo from "Foo"', 'foo;'].join('\n'),
      );
      const value = resolveToValue(path);

      expect(value.node.type).toBe('ImportDeclaration');
    });

    it('resolves named import references to the import declaration', () => {
      const path = parse.expressionLast(
        ['import {foo} from "Foo"', 'foo;'].join('\n'),
      );
      const value = resolveToValue(path);

      expect(value.node.type).toBe('ImportDeclaration');
    });

    it('resolves aliased import references to the import declaration', () => {
      const path = parse.expressionLast(
        ['import {foo as bar} from "Foo"', 'bar;'].join('\n'),
      );
      const value = resolveToValue(path);

      expect(value.node.type).toBe('ImportDeclaration');
    });

    it('resolves namespace import references to the import declaration', () => {
      const path = parse.expressionLast(
        ['import * as bar from "Foo"', 'bar;'].join('\n'),
      );
      const value = resolveToValue(path);

      expect(value.node.type).toBe('ImportDeclaration');
    });
  });

  describe('MemberExpression', () => {
    it("resolves a MemberExpression to it's init value", () => {
      const path = parse.expressionLast(
        ['var foo = { bar: 1 };', 'foo.bar;'].join('\n'),
      );

      expect(resolveToValue(path)).toEqualASTNode(numericLiteral(1));
    });

    it('resolves a MemberExpression in the scope chain', () => {
      const path = parse.expressionLast(
        ['var foo = 1;', 'var bar = { baz: foo };', 'bar.baz;'].join('\n'),
      );

      expect(resolveToValue(path)).toEqualASTNode(numericLiteral(1));
    });

    it('resolves a nested MemberExpression in the scope chain', () => {
      const path = parse.expressionLast(
        [
          'var foo = { bar: 1 };',
          'var bar = { baz: foo.bar };',
          'bar.baz;',
        ].join('\n'),
      );

      expect(resolveToValue(path)).toEqualASTNode(numericLiteral(1));
    });

    it('returns the last resolvable MemberExpression', () => {
      const path = parse.expressionLast(
        [
          'import foo from "bar";',
          'var bar = { baz: foo.bar };',
          'bar.baz;',
        ].join('\n'),
      );

      expect(resolveToValue(path)).toEqualASTNode(
        memberExpression(identifier('foo'), identifier('bar'), false, false),
      );
    });

    it('returns the path itself if it can not resolve it any further', () => {
      const path = parse.expressionLast(
        `var foo = {};
        foo.bar = 1;
        foo.bar;`,
      );

      expect(resolveToValue(path)).toEqualASTNode(path);
    });
  });
});
