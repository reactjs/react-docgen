/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global describe, it, expect*/

import recast from 'recast';

const builders = recast.types.builders;
import resolveToValue from '../resolveToValue';
import * as utils from '../../../tests/utils';

describe('resolveToValue', () => {
  function parse(src) {
    const root = utils.parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  it('resolves simple variable declarations', () => {
    const path = parse(['var foo  = 42;', 'foo;'].join('\n'));
    expect(resolveToValue(path).node).toEqualASTNode(builders.literal(42));
  });

  it('resolves object destructuring', () => {
    const path = parse(['var {foo: {bar: baz}} = bar;', 'baz;'].join('\n'));

    // Node should be equal to bar.foo.bar
    expect(resolveToValue(path).node).toEqualASTNode(
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
    const path = parse(['var {foo: {bar}, ...baz} = bar;', 'baz;'].join('\n'));

    expect(resolveToValue(path).node).toEqualASTNode(path.node);
  });

  it('returns the original path if it cannot be resolved', () => {
    const path = parse(['function foo() {}', 'foo()'].join('\n'));

    expect(resolveToValue(path).node).toEqualASTNode(path.node);
  });

  it('resolves variable declarators to their init value', () => {
    const path = utils.parse('var foo = 42;').get('body', 0, 'declarations', 0);

    expect(resolveToValue(path).node).toEqualASTNode(builders.literal(42));
  });

  it('resolves to class declarations', () => {
    const program = utils.parse(`
      class Foo {}
      Foo;
    `);
    expect(resolveToValue(program.get('body', 1, 'expression')).node.type).toBe(
      'ClassDeclaration',
    );
  });

  it('resolves to class function declaration', () => {
    const program = utils.parse(`
      function foo() {}
      foo;
    `);
    expect(resolveToValue(program.get('body', 1, 'expression')).node.type).toBe(
      'FunctionDeclaration',
    );
  });

  describe('assignments', () => {
    it('resolves to assigned values', () => {
      const path = parse(['var foo;', 'foo = 42;', 'foo;'].join('\n'));

      expect(resolveToValue(path).node).toEqualASTNode(builders.literal(42));
    });
  });

  describe('ImportDeclaration', () => {
    it('resolves default import references to the import declaration', () => {
      const path = parse(['import foo from "Foo"', 'foo;'].join('\n'));

      expect(resolveToValue(path).node.type).toBe('ImportDeclaration');
    });

    it('resolves named import references to the import declaration', () => {
      const path = parse(['import {foo} from "Foo"', 'foo;'].join('\n'));

      expect(resolveToValue(path).node.type).toBe('ImportDeclaration');
    });

    it('resolves aliased import references to the import declaration', () => {
      const path = parse(['import {foo as bar} from "Foo"', 'bar;'].join('\n'));

      expect(resolveToValue(path).node.type).toBe('ImportDeclaration');
    });

    it('resolves namespace import references to the import declaration', () => {
      const path = parse(['import * as bar from "Foo"', 'bar;'].join('\n'));

      expect(resolveToValue(path).node.type).toBe('ImportDeclaration');
    });
  });

  describe('MemberExpression', () => {
    it("resolves a MemberExpression to it's init value", () => {
      const path = parse(['var foo = { bar: 1 };', 'foo.bar;'].join('\n'));

      expect(resolveToValue(path).node).toEqualASTNode(builders.literal(1));
    });

    it('resolves a MemberExpression in the scope chain', () => {
      const path = parse(
        ['var foo = 1;', 'var bar = { baz: foo };', 'bar.baz;'].join('\n'),
      );

      expect(resolveToValue(path).node).toEqualASTNode(builders.literal(1));
    });

    it('resolves a nested MemberExpression in the scope chain', () => {
      const path = parse(
        [
          'var foo = { bar: 1 };',
          'var bar = { baz: foo.bar };',
          'bar.baz;',
        ].join('\n'),
      );

      expect(resolveToValue(path).node).toEqualASTNode(builders.literal(1));
    });

    it('returns the last resolvable MemberExpression', () => {
      const path = parse(
        [
          'import foo from "bar";',
          'var bar = { baz: foo.bar };',
          'bar.baz;',
        ].join('\n'),
      );

      expect(resolveToValue(path).node).toEqualASTNode(
        builders.memberExpression(
          builders.identifier('foo'),
          builders.identifier('bar'),
        ),
      );
    });

    it('returns the path itself if it can not resolve it any further', () => {
      const path = parse(
        ['var foo = {};', 'foo.bar = 1;', 'foo.bar;'].join('\n'),
      );

      expect(resolveToValue(path).node).toEqualASTNode(path.node);
    });
  });
});
