/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('isRequiredPropType', () => {
  let expression;
  let isRequiredPropType;

  beforeEach(() => {
    isRequiredPropType = require('../isRequiredPropType').default;
    ({ expression } = require('../../../tests/utils'));
  });

  it('considers isRequired', () => {
    expect(isRequiredPropType(expression('foo.bar.isRequired'))).toEqual(true);
    expect(isRequiredPropType(expression('foo.isRequired.bar'))).toEqual(true);
  });

  it('considers ["isRequired"]', () => {
    expect(isRequiredPropType(expression('foo.bar["isRequired"]'))).toEqual(
      true,
    );
    expect(isRequiredPropType(expression('foo["isRequired"].bar'))).toEqual(
      true,
    );
  });

  it('ignores variables', () => {
    expect(isRequiredPropType(expression('foo.bar[isRequired]'))).toEqual(
      false,
    );
  });
});
