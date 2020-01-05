/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { parse } from '../../../tests/utils';
import resolveToModule from '../resolveToModule';

describe('resolveToModule', () => {
  function parsePath(src) {
    const root = parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  it('resolves identifiers', () => {
    const path = parsePath(`
      var foo = require("Foo");
      foo;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('resolves function calls', () => {
    const path = parsePath(`
      var foo = require("Foo");
      foo();
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('resolves member expressions', () => {
    const path = parsePath(`
      var foo = require("Foo");
      foo.bar().baz;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('understands destructuring', () => {
    const path = parsePath(`
      var {foo} = require("Foo");
      foo;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  describe('ES6 import declarations', () => {
    it('resolves ImportDefaultSpecifier', () => {
      let path = parsePath(`
        import foo from "Foo";
        foo;
      `);
      expect(resolveToModule(path)).toBe('Foo');

      path = parsePath(`
        import foo, {createElement} from "Foo";
        foo;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('resolves ImportSpecifier', () => {
      const path = parsePath(`
        import {foo, bar} from "Foo";
        bar;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('resolves aliased ImportSpecifier', () => {
      const path = parsePath(`
        import {foo, bar as baz} from "Foo";
        baz;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('resolves ImportNamespaceSpecifier', () => {
      const path = parsePath(`
        import * as foo from "Foo";
        foo;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });
  });
});
