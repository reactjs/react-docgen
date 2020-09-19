/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { builders } from 'ast-types';
import { parse, noopImporter } from '../../../tests/utils';
import resolveToValue from '../resolveToValue';

describe('resolveToValue', () => {
  function parsePath(src, options = {}) {
    const root = parse(src.trim(), options);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  it('resolves simple variable declarations', () => {
    const path = parsePath(['var foo  = 42;', 'foo;'].join('\n'));
    expect(resolveToValue(path, noopImporter)).toEqualASTNode(builders.literal(42));
  });

  it('resolves object destructuring', () => {
    const path = parsePath(['var {foo: {bar: baz}} = bar;', 'baz;'].join('\n'));

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
    const path = parsePath(
      ['var {foo: {bar}, ...baz} = bar;', 'baz;'].join('\n'),
    );

    expect(resolveToValue(path, noopImporter)).toEqualASTNode(path);
  });

  it('returns the original path if it cannot be resolved', () => {
    const path = parsePath(['function foo() {}', 'foo()'].join('\n'));

    expect(resolveToValue(path, noopImporter)).toEqualASTNode(path);
  });

  it('resolves variable declarators to their init value', () => {
    const path = parse('var foo = 42;').get('body', 0, 'declarations', 0);

    expect(resolveToValue(path, noopImporter)).toEqualASTNode(builders.literal(42));
  });

  it('resolves to class declarations', () => {
    const path = parsePath(`
      class Foo {}
      Foo;
    `);
    expect(resolveToValue(path, noopImporter).node.type).toBe('ClassDeclaration');
  });

  it('resolves to class function declaration', () => {
    const path = parsePath(`
      function foo() {}
      foo;
    `);
    expect(resolveToValue(path, noopImporter).node.type).toBe('FunctionDeclaration');
  });

  describe('flow', () => {
    it('resolves type cast expressions', () => {
      const path = parsePath(`
      function foo() {}
      (foo: any);
    `);
      expect(resolveToValue(path, noopImporter).node.type).toBe('FunctionDeclaration');
    });
  });

  describe('typescript', () => {
    const parseTypescript = src =>
      parsePath(src, { parserOptions: { plugins: ['typescript'] } });

    it('resolves type as expressions', () => {
      const path = parseTypescript(`
      function foo() {}
      (foo as any);
    `);
      expect(resolveToValue(path, noopImporter).node.type).toBe('FunctionDeclaration');
    });

    it('resolves type assertions', () => {
      const path = parseTypescript(`
      function foo() {}
      (<any> foo);
    `);
      expect(resolveToValue(path, noopImporter).node.type).toBe('FunctionDeclaration');
    });
  });

  describe('assignments', () => {
    it('resolves to assigned values', () => {
      const path = parsePath(['var foo;', 'foo = 42;', 'foo;'].join('\n'));

      expect(resolveToValue(path, noopImporter)).toEqualASTNode(builders.literal(42));
    });

    it('resolves to other assigned value if ref is in an assignment lhs', () => {
      const path = parsePath(
        ['var foo;', 'foo = 42;', 'foo = wrap(foo);'].join('\n'),
      );

      expect(resolveToValue(path.get('left'), noopImporter)).toEqualASTNode(
        builders.literal(42),
      );
    });

    it('resolves to other assigned value if ref is in an assignment rhs', () => {
      const path = parsePath(
        ['var foo;', 'foo = 42;', 'foo = wrap(foo);'].join('\n'),
      );

      expect(resolveToValue(path.get('right', 'arguments', 0), noopImporter)).toEqualASTNode(
        builders.literal(42),
      );
    });
  });

  describe('ImportDeclaration', () => {
    it('resolves default import references to the import declaration', () => {
      const path = parsePath(['import foo from "Foo"', 'foo;'].join('\n'));
      const value = resolveToValue(path, noopImporter);

      expect(Array.isArray(value.value)).toBe(false);
      expect(value.node.type).toBe('ImportDeclaration');
    });

    it('resolves named import references to the import declaration', () => {
      const path = parsePath(['import {foo} from "Foo"', 'foo;'].join('\n'));
      const value = resolveToValue(path, noopImporter);

      expect(Array.isArray(value.value)).toBe(false);
      expect(value.node.type).toBe('ImportDeclaration');
    });

    it('resolves aliased import references to the import declaration', () => {
      const path = parsePath(
        ['import {foo as bar} from "Foo"', 'bar;'].join('\n'),
      );
      const value = resolveToValue(path, noopImporter);

      expect(Array.isArray(value.value)).toBe(false);
      expect(value.node.type).toBe('ImportDeclaration');
    });

    it('resolves namespace import references to the import declaration', () => {
      const path = parsePath(['import * as bar from "Foo"', 'bar;'].join('\n'));
      const value = resolveToValue(path, noopImporter);

      expect(Array.isArray(value.value)).toBe(false);
      expect(value.node.type).toBe('ImportDeclaration');
    });
  });

  describe('MemberExpression', () => {
    it("resolves a MemberExpression to it's init value", () => {
      const path = parsePath(['var foo = { bar: 1 };', 'foo.bar;'].join('\n'));

      expect(resolveToValue(path, noopImporter)).toEqualASTNode(builders.literal(1));
    });

    it('resolves a MemberExpression in the scope chain', () => {
      const path = parsePath(
        ['var foo = 1;', 'var bar = { baz: foo };', 'bar.baz;'].join('\n'),
      );

      expect(resolveToValue(path, noopImporter)).toEqualASTNode(builders.literal(1));
    });

    it('resolves a nested MemberExpression in the scope chain', () => {
      const path = parsePath(
        [
          'var foo = { bar: 1 };',
          'var bar = { baz: foo.bar };',
          'bar.baz;',
        ].join('\n'),
      );

      expect(resolveToValue(path, noopImporter)).toEqualASTNode(builders.literal(1));
    });

    it('returns the last resolvable MemberExpression', () => {
      const path = parsePath(
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
      const path = parsePath(
        ['var foo = {};', 'foo.bar = 1;', 'foo.bar;'].join('\n'),
      );

      expect(resolveToValue(path, noopImporter)).toEqualASTNode(path);
    });
  });
});
