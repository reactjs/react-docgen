/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.autoMockOff();

describe('getParameterName', () => {
  let getParameterName;
  let expression;

  beforeEach(() => {
    getParameterName = require('../getParameterName');
    ({expression} = require('../../../tests/utils'));
  });

  it('returns the name for a normal parameter', () => {
    const def = expression('function(a) {}');
    const param = def.get('params', 0);
    expect(getParameterName(param)).toEqual('a');
  });

  it('returns the name for a rest parameter', () => {
    const def = expression('function(...a) {}');
    const param = def.get('params', 0);
    expect(getParameterName(param)).toEqual('...a');
  });

  it('returns the name for a parameter with a default value', () => {
    const def = expression('function(a = 0) {}');
    const param = def.get('params', 0);
    expect(getParameterName(param)).toEqual('a');
  });

  it('returns the raw object representation for a parameter with destructuring', () => {
    const def = expression('function({a}) {}');
    const param = def.get('params', 0);
    expect(getParameterName(param)).toEqual('{a}');
  });

  it('throws when passed an invalid path', () => {
    const def = expression('function() {}');
    const param = def;
    expect(() => getParameterName(param)).toThrow();
  });
});
