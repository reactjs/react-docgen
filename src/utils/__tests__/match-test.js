/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('match', () => {
  let match;

  beforeEach(() => {
    match = require('../match').default;
  });

  it('matches with exact properties', () => {
    expect(match({ foo: { bar: 42 } }, { foo: { bar: 42 } })).toBe(true);
  });

  it('matches a subset of properties in the target', () => {
    expect(match({ foo: { bar: 42, baz: 'xyz' } }, { foo: { bar: 42 } })).toBe(
      true,
    );
  });

  it('does not match if properties are different/missing', () => {
    expect(
      match({ foo: { bar: 42, baz: 'xyz' } }, { foo: { bar: 21, baz: 'xyz' } }),
    ).toBe(false);

    expect(
      match({ foo: { baz: 'xyz' } }, { foo: { bar: 21, baz: 'xyz' } }),
    ).toBe(false);
  });
});
