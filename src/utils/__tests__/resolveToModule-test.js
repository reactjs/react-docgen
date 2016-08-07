/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('resolveToModule', () => {
  var utils;
  var resolveToModule;

  function parse(src) {
    var root = utils.parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  beforeEach(() => {
    resolveToModule = require('../resolveToModule').default;
    utils = require('../../../tests/utils');
  });

  it('resolves identifiers', () => {
    var path = parse(`
      var foo = require("Foo");
      foo;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('resolves function calls', () => {
    var path = parse(`
      var foo = require("Foo");
      foo();
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('resolves member expressions', () => {
    var path = parse(`
      var foo = require("Foo");
      foo.bar().baz;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('understands destructuring', () => {
    var path = parse(`
      var {foo} = require("Foo");
      foo;
    `);
    expect(resolveToModule(path)).toBe('Foo');
  });

  describe('ES6 import declarations', () => {

    it('resolves ImportDefaultSpecifier', () => {
      var path = parse(`
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
      var path = parse(`
        import {foo, bar} from "Foo";
        bar;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('resolves aliased ImportSpecifier', () => {
      var path = parse(`
        import {foo, bar as baz} from "Foo";
        baz;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

    it('resolves ImportNamespaceSpecifier', () => {
      var path = parse(`
        import * as foo from "Foo";
        foo;
      `);
      expect(resolveToModule(path)).toBe('Foo');
    });

  });
});
