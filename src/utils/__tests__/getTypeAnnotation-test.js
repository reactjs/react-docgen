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
