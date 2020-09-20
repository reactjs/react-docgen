/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  statement,
  noopImporter,
  makeMockImporter,
} from '../../../tests/utils';
import getPropertyValuePath from '../getPropertyValuePath';

describe('getPropertyValuePath', () => {
  const mockImporter = makeMockImporter({
    bar: statement(`
      export default 'bar';
    `).get('declaration'),
  });

  it('returns the value path if the property exists', () => {
    const objectExpressionPath = statement('({foo: 21, bar: 42})').get(
      'expression',
    );
    expect(
      getPropertyValuePath(objectExpressionPath, 'bar', noopImporter),
    ).toBe(objectExpressionPath.get('properties', 1).get('value'));
  });

  it('returns the value path for a computed property in scope', () => {
    const objectExpressionPath = statement(`
      ({foo: 21, [a]: 42});
      var a = 'bar';
    `).get('expression');
    expect(
      getPropertyValuePath(objectExpressionPath, 'bar', noopImporter),
    ).toBe(objectExpressionPath.get('properties', 1).get('value'));
  });

  it('returns undefined if the property does not exist', () => {
    const objectExpressionPath = statement('({foo: 21, bar: 42})').get(
      'expression',
    );
    expect(
      getPropertyValuePath(objectExpressionPath, 'baz', noopImporter),
    ).toBeUndefined();
  });

  it('returns the value path for a computed property that was imported', () => {
    const objectExpressionPath = statement(`
      ({foo: 21, [a]: 42});
      import a from 'bar';
    `).get('expression');
    expect(
      getPropertyValuePath(objectExpressionPath, 'bar', mockImporter),
    ).toBe(objectExpressionPath.get('properties', 1).get('value'));
  });
});
