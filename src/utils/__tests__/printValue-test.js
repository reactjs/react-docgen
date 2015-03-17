/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

"use strict";

jest.autoMockOff();

describe('printValue', function() {
  var printValue;
  var utils;

  beforeEach(function() {
    printValue = require('../printValue');
    utils = require('../../../tests/utils');
  });

  function pathFromSource(source) {
    return utils.parse(source).get('body', 0, 'expression');
  }

  it('does not print leading comments', function() {
    expect(printValue(pathFromSource('//foo\nbar')))
      .toEqual('bar');
  });

  it('does not print trailing comments', function() {
    expect(printValue(pathFromSource('bar//foo')))
      .toEqual('bar');
  });

});
