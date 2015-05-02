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

  it('resolves export variable declarator', () => {
    var path = parse([
      'export var Component = foo()'
    ].join('\n'));

    expect(
      resolveToValue(path.parentPath.get('declaration')).node.callee.name
    ).toBe('foo');
  });

  it('resolves export default declarator', () => {
    var path = parse([
      'var Component = foo();',
      'export default Component;'
    ].join('\n'));

    expect(
      resolveToValue(path.parentPath.get('declaration')).node.callee.name
    ).toBe('foo');
  });

});
