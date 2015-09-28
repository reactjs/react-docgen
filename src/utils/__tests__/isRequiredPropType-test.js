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

describe('isRequiredPropType', () => {
  var expression;
  var isRequiredPropType;

  beforeEach(() => {
    isRequiredPropType = require('../isRequiredPropType');
    ({expression} = require('../../../tests/utils'));
  });


  it('considers isRequired', () => {
    expect(isRequiredPropType(expression('foo.bar.isRequired'))).toEqual(true);
    expect(isRequiredPropType(expression('foo.isRequired.bar'))).toEqual(true);
  });

  it('considers ["isRequired"]', () => {
    expect(isRequiredPropType(expression('foo.bar["isRequired"]')))
      .toEqual(true);
    expect(isRequiredPropType(expression('foo["isRequired"].bar')))
      .toEqual(true);
  });

  it('ignores variables', () => {
    expect(isRequiredPropType(expression('foo.bar[isRequired]')))
      .toEqual(false);
  });

});

