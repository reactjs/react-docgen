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

describe('resolveToIdentifier', () => {
  var utils;
  var resolveToIdentifier;

  function parse(src) {
    var root = utils.parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  beforeEach(() => {
    resolveToIdentifier = require('../resolveToIdentifier').default;
    utils = require('../../../tests/utils');
  });
  
  it('resolves identifiers', () => {
    var path = parse(`
      var foo = require("Foo");
      foo;
    `);
    expect(resolveToIdentifier(path)).toBe('foo');
  });

  it('resolves function calls', () => {
    var path = parse(`
      var foo = require("Foo");
      foo();
    `);
    expect(resolveToIdentifier(path)).toBe('foo');
  });

  it('understands destructuring', () => {
    var path = parse(`
      var {foo} = require("Foo");
      foo;
    `);
    expect(resolveToIdentifier(path)).toBe('foo');
  });

  describe('ES6 import declarations', () => {

    it('resolves ImportDefaultSpecifier', () => {
      var path = parse(`
        import foo from "Foo";
        foo;
      `);
      expect(resolveToIdentifier(path)).toBe('foo');

      path = parse(`
        import foo, {createElement} from "Foo";
        foo;
      `);
      expect(resolveToIdentifier(path)).toBe('foo');
    });

    it('resolves ImportSpecifier', () => {
      var path = parse(`
        import {foo, bar} from "Foo";
        bar;
      `);
      expect(resolveToIdentifier(path)).toBe('bar');
    });

    it('resolves aliased ImportSpecifier', () => {
      var path = parse(`
        import {foo, bar as baz} from "Foo";
        baz;
      `);
      expect(resolveToIdentifier(path)).toBe('bar');
    });

    it('resolves ImportNamespaceSpecifier', () => {
      var path = parse(`
        import * as foo from "Foo";
        foo;
      `);
      expect(resolveToIdentifier(path)).toBe('foo');
    });

  });
});
