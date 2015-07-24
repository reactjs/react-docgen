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

jest.autoMockOff();

describe('getPropertyValuePath', () => {
  var recast;
  var getPropertyValuePath;

  function parse(src) {
    return new recast.types.NodePath(
      recast.parse(src).program.body[0]
    );
  }

  beforeEach(() => {
    getPropertyValuePath = require('../getPropertyValuePath');
    recast = require('recast');
  });

  it('returns the value path if the property exists', () => {
    var objectExpressionPath = parse('({foo: 21, bar: 42})').get('expression');
    expect(getPropertyValuePath(objectExpressionPath, 'bar'))
      .toBe(objectExpressionPath.get('properties', 1).get('value'));
  });

  it('returns undefined if the property does not exist', () => {
    var objectExpressionPath = parse('({foo: 21, bar: 42})').get('expression');
    expect(getPropertyValuePath(objectExpressionPath, 'baz'))
      .toBeUndefined();
  });

});
