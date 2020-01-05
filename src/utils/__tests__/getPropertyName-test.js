/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

import { parse, expression } from '../../../tests/utils';
import getPropertyName from '../getPropertyName';

describe('getPropertyName', () => {
  function parsePath(src) {
    const root = parse(src.trim());
    return root.get('body', root.node.body.length - 1, 'expression');
  }

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

    expect(getPropertyName(param)).toBe('foo');
  });

  it('creates name for computed properties from int', () => {
    const def = expression('{ [31]: 21 }');
    const param = def.get('properties', 0);

    expect(getPropertyName(param)).toBe('31');
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

  it('resolves simple variables', () => {
    const def = parsePath(`
    const foo = "name";

    ({ [foo]: 21 });
    `);
    const param = def.get('properties', 0);

    expect(getPropertyName(param)).toBe('name');
  });

  it('resolves simple member expressions', () => {
    const def = parsePath(`
    const a = { foo: "name" };

    ({ [a.foo]: 21 });
    `);
    const param = def.get('properties', 0);

    expect(getPropertyName(param)).toBe('name');
  });
});
