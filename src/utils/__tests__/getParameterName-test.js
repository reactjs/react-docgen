/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('getParameterName', () => {
  let getParameterName;
  let expression;

  beforeEach(() => {
    getParameterName = require('../getParameterName').default;
    ({ expression } = require('../../../tests/utils'));
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

  it('returns the raw representation for a parameter with object destructuring', () => {
    const def = expression('function({a}) {}');
    const param = def.get('params', 0);
    expect(getParameterName(param)).toEqual('{a}');
  });
  it('returns the raw representation for a parameter with array destructuring', () => {
    const def = expression('function([a]) {}');
    const param = def.get('params', 0);
    expect(getParameterName(param)).toEqual('[a]');
  });

  it('throws when passed an invalid path', () => {
    const def = expression('function() {}');
    const param = def;
    expect(() => getParameterName(param)).toThrow();
  });
});
