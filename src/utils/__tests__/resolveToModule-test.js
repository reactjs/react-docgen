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

describe('resolveToModule', () => {
  var utils;
  var resolveToModule;

  function parse(src) {
    var root = utils.parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  beforeEach(() => {
    resolveToModule = require('../resolveToModule');
    utils = require('../../../tests/utils');
  });

  it('resolves identifiers', () => {
    var path = parse([
      'var foo = require("Foo");',
      'foo;'
    ].join('\n'));
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('resolves function calls', () => {
    var path = parse([
      'var foo = require("Foo");',
      'foo();'
    ].join('\n'));
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('resolves member expressions', () => {
    var path = parse([
      'var foo = require("Foo");',
      'foo.bar().baz;'
    ].join('\n'));
    expect(resolveToModule(path)).toBe('Foo');
  });

  it('understands destructuring', () => {
    var path = parse([
      'var {foo} = require("Foo");',
      'foo;'
    ].join('\n'));
    expect(resolveToModule(path)).toBe('Foo');
  });
});
