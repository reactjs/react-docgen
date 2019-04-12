/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('getPropertyValuePath', () => {
  let recast;
  let getPropertyValuePath;

  function parse(src) {
    return new recast.types.NodePath(recast.parse(src).program.body[0]);
  }

  beforeEach(() => {
    getPropertyValuePath = require('../getPropertyValuePath').default;
    recast = require('recast');
  });

  it('returns the value path if the property exists', () => {
    const objectExpressionPath = parse('({foo: 21, bar: 42})').get(
      'expression',
    );
    expect(getPropertyValuePath(objectExpressionPath, 'bar')).toBe(
      objectExpressionPath.get('properties', 1).get('value'),
    );
  });

  it('returns undefined if the property does not exist', () => {
    const objectExpressionPath = parse('({foo: 21, bar: 42})').get(
      'expression',
    );
    expect(getPropertyValuePath(objectExpressionPath, 'baz')).toBeUndefined();
  });
});
