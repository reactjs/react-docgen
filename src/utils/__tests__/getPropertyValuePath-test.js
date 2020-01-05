/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { statement } from '../../../tests/utils';
import getPropertyValuePath from '../getPropertyValuePath';

describe('getPropertyValuePath', () => {
  it('returns the value path if the property exists', () => {
    const objectExpressionPath = statement('({foo: 21, bar: 42})').get(
      'expression',
    );
    expect(getPropertyValuePath(objectExpressionPath, 'bar')).toBe(
      objectExpressionPath.get('properties', 1).get('value'),
    );
  });

  it('returns undefined if the property does not exist', () => {
    const objectExpressionPath = statement('({foo: 21, bar: 42})').get(
      'expression',
    );
    expect(getPropertyValuePath(objectExpressionPath, 'baz')).toBeUndefined();
  });
});
