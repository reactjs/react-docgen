/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

describe('getPropertyName', () => {
  let getPropertyName;
  let expression;

  beforeEach(() => {
    getPropertyName = require('../getPropertyName').default;
    ({ expression } = require('../../../tests/utils'));
  });

  it('returns the name for a normal property', () => {
    const def = expression('{ foo: 1 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param)).toBe('foo');
  });

  it('returns the name of a object type spread property', () => {
    const def = expression('(a: { ...foo })');
    const param = def.get('typeAnnotation', 'typeAnnotation', 'properties', 0);

    expect(getPropertyName(param)).toBe('foo');
  });

  it('creates name for computed properties', () => {
    const def = expression('{ [foo]: 21 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param)).toBe('@computed#foo');
  });

  it('creates name for computed properties from string', () => {
    const def = expression('{ ["foo"]: 21 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param)).toBe('@computed#foo');
  });

  it('creates name for computed properties from int', () => {
    const def = expression('{ [31]: 21 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param)).toBe('@computed#31');
  });

  it('returns null for computed properties from regex', () => {
    const def = expression('{ [/31/]: 21 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param)).toBe(null);
  });

  it('returns null for to complex computed properties', () => {
    const def = expression('{ [() => {}]: 21 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param)).toBe(null);
  });
});
