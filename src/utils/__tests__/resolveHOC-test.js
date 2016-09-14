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

describe('resolveHOC', () => {
  var builders;
  var utils;
  var resolveHOC;

  function parse(src) {
    var root = utils.parse(src);
    return root.get('body', root.node.body.length - 1, 'expression');
  }

  beforeEach(() => {
    var recast = require('recast');
    builders = recast.types.builders;
    resolveHOC = require('../resolveHOC').default;
    utils = require('../../../tests/utils');
  });

  it('resolves simple hoc', () => {
    var path = parse([
      'hoc(42);',
    ].join('\n'));
    expect(resolveHOC(path).node).toEqualASTNode(builders.literal(42));
  });

  it('resolves simple hoc w/ multiple args', () => {
    var path = parse([
      'hoc1(arg1a, arg1b)(42);',
    ].join('\n'));
    expect(resolveHOC(path).node).toEqualASTNode(builders.literal(42));
  });

  it('resolves nested hocs', () => {
    var path = parse([
      'hoc2(arg2b, arg2b)(',
      '  hoc1(arg1a, arg2a)(42)',
      ');',
    ].join('\n'));
    expect(resolveHOC(path).node).toEqualASTNode(builders.literal(42));
  });

  it('resolves really nested hocs', () => {
    var path = parse([
      'hoc3(arg3a, arg3b)(',
      '  hoc2(arg2b, arg2b)(',
      '    hoc1(arg1a, arg2a)(42)',
      '  )',
      ');',
    ].join('\n'));
    expect(resolveHOC(path).node).toEqualASTNode(builders.literal(42));
  });

});
