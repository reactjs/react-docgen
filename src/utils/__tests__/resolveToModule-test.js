/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('resolveToModule', () => {
  let utils;
  let resolveToModule;

  function parse(src) {
    const root = utils.parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  beforeEach(() => {
    resolveToModule = require('../resolveToModule').default;
    utils = require('../../../tests/utils');
  });

  it('resolves identifiers', () => {
    const path = parse(`
      var foo = require("Foo");
      foo;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('resolves function calls', () => {
    const path = parse(`
      var foo = require("Foo");
      foo();
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('resolves member expressions', () => {
    const path = parse(`
      var foo = require("Foo");
      foo.bar().baz;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('understands destructuring', () => {
    const path = parse(`
      var {foo} = require("Foo");
      foo;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  describe('ES6 import declarations', () => {
    it('resolves ImportDefaultSpecifier', () => {
      let path = parse(`
        import foo from "Foo";
        foo;
      `);
      expect(resolveToModule(path)).toBe('Foo');

      path = parse(`
        import foo, {createElement} from "Foo";
        foo;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('resolves ImportSpecifier', () => {
      const path = parse(`
        import {foo, bar} from "Foo";
        bar;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('resolves aliased ImportSpecifier', () => {
      const path = parse(`
        import {foo, bar as baz} from "Foo";
        baz;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('resolves ImportNamespaceSpecifier', () => {
      const path = parse(`
        import * as foo from "Foo";
        foo;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });
  });
});
