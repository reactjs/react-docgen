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

describe('resolveToCallExpression', () => {
  var utils;
  var resolveToCallExpression;
  var match;

  function parse(src) {
    var root = utils.parse(src);
    return root.get('body', root.node.body.length - 1);
  }

  function runAndMatchNode(path, result) {
    return match(resolveToCallExpression(path).node, result);
  }

  beforeEach(() => {
    resolveToCallExpression = require('../resolveToCallExpression');
    utils = require('../../../tests/utils');
    match = require('../match');
  });

  it('resolves variable declarator', () => {
    var path = parse([
      'var Component = foo()'
    ].join('\n'));

    expect(runAndMatchNode(path, {callee: {name: 'foo'}})).toBe(true);
  });

  it('resolves export variable declarator', () => {
    var path = parse([
      'export var Component = foo()'
    ].join('\n'));

    expect(runAndMatchNode(path, {callee: {name: 'foo'}})).toBe(true);

  });

  it('resolves export default declarator', () => {
    var path = parse([
      'var Component = foo();',
      'export default Component;'
    ].join('\n'));

    expect(runAndMatchNode(path, {callee: {name: 'foo'}})).toBe(true);
  });

});
