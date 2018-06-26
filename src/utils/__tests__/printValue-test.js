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

describe('printValue', () => {
  var printValue;
  var utils;

  beforeEach(() => {
    printValue = require('../printValue').default;
    utils = require('../../../tests/utils');
  });

  function pathFromSource(source) {
    return utils.parse(source).get('body', 0, 'expression');
  }

  it('does not print leading comments', () => {
    expect(printValue(pathFromSource('//foo\nbar'))).toEqual('bar');
  });

  it('does not print trailing comments', () => {
    expect(printValue(pathFromSource('bar//foo'))).toEqual('bar');
  });
});
