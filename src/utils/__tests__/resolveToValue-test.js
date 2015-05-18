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

"use strict";

jest.autoMockOff();

describe('resolveToValue', () => {
  var astNodesAreEquivalent;
  var builders;
  var utils;
  var resolveToValue;

  function parse(src) {
    var root = utils.parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  beforeEach(() => {
    var recast = require('recast');
    astNodesAreEquivalent = recast.types.astNodesAreEquivalent;
    builders = recast.types.builders;
    resolveToValue = require('../resolveToValue');
    utils = require('../../../tests/utils');
  });

  it('resolves simple variable declarations', () => {
    var path = parse([
      'var foo  = 42;',
      'foo;'
    ].join('\n'));
    expect(astNodesAreEquivalent(
      resolveToValue(path).node,
      builders.literal(42)
    )).toBe(true);
  });

  it('resolves object destructuring', () => {
    var path = parse([
      'var {foo: {bar: baz}} = bar;',
      'baz;'
    ].join('\n'));

    // Node should be equal to bar.foo.bar
    expect(astNodesAreEquivalent(
      resolveToValue(path).node,
      builders.memberExpression(
        builders.memberExpression(
          builders.identifier('bar'),
          builders.identifier('foo')
        ),
        builders.identifier('bar')
      )
    )).toBe(true);
  });

  it('handles SpreadProperties properly', () => {
    var path = parse([
      'var {foo: {bar}, ...baz} = bar;',
      'baz;'
    ].join('\n'));

    expect(astNodesAreEquivalent(
      resolveToValue(path).node,
      path.node
    )).toBe(true);
  });

  it('returns the original path if it cannot be resolved', () => {
    var path = parse([
      'function foo() {}',
      'foo()'
    ].join('\n'));

    expect(astNodesAreEquivalent(
      resolveToValue(path).node,
      path.node
    )).toBe(true);
  });

  it('resolves variable declarators to their init value', () => {
    var path = utils.parse('var foo = 42;').get('body', 0, 'declarations', 0);

    expect(astNodesAreEquivalent(
      resolveToValue(path).node,
      builders.literal(42)
    )).toBe(true);
  });

  describe('ImportDeclaration', () => {

    it('resolves default import references to the import declaration', () => {
      var path = parse([
        'import foo from "Foo"',
        'foo;'
      ].join('\n'));

      expect(resolveToValue(path).node.type).toBe('ImportDeclaration');
    });

    it('resolves named import references to the import declaration', () => {
      var path = parse([
        'import {foo} from "Foo"',
        'foo;'
      ].join('\n'));

      expect(resolveToValue(path).node.type).toBe('ImportDeclaration');
    });

    it('resolves aliased import references to the import declaration', () => {
      var path = parse([
        'import {foo as bar} from "Foo"',
        'bar;'
      ].join('\n'));

      expect(resolveToValue(path).node.type).toBe('ImportDeclaration');
    });

  });

});
