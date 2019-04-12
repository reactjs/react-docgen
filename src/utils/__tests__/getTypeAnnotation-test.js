/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('getTypeAnnotation', () => {
  let expression;
  let getTypeAnnotation;

  beforeEach(() => {
    getTypeAnnotation = require('../getTypeAnnotation').default;
    ({ expression } = require('../../../tests/utils'));
  });

  it('detects simple type', () => {
    const path = expression('x: xyz');

    expect(getTypeAnnotation(path)).toEqual(
      path.get('typeAnnotation').get('typeAnnotation'),
    );
  });

  it('does not fail if no type', () => {
    const path = expression('x = 0');

    expect(getTypeAnnotation(path)).toEqual(null);
  });

  it('stops at first nested type', () => {
    const path = expression('x: ?xyz');

    expect(getTypeAnnotation(path)).toEqual(
      path.get('typeAnnotation').get('typeAnnotation'),
    );
  });
});
