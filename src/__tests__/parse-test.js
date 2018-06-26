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

describe('parse', () => {
  var utils;
  var parse, ERROR_MISSING_DEFINITION;

  beforeEach(() => {
    utils = require('../../tests/utils');
    // ugly but necessary because ../parse has default and named exports
    ({ default: parse, ERROR_MISSING_DEFINITION } = require('../parse'));
  });

  function pathFromSource(source) {
    return utils.parse(source).get('body', 0, 'expression');
  }

  it('allows custom component definition resolvers', () => {
    var path = pathFromSource('({foo: "bar"})');
    var resolver = jest.fn(() => path);
    var handler = jest.fn();
    parse('//empty', resolver, [handler]);

    expect(resolver).toBeCalled();
    expect(handler.mock.calls[0][1]).toBe(path);
  });

  it('errors if component definition is not found', () => {
    var resolver = jest.fn();
    expect(() => parse('//empty', resolver)).toThrowError(
      ERROR_MISSING_DEFINITION,
    );
    expect(resolver).toBeCalled();

    expect(() => parse('//empty', resolver)).toThrowError(
      ERROR_MISSING_DEFINITION,
    );
    expect(resolver).toBeCalled();
  });
});
