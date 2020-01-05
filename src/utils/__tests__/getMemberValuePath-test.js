/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('../getPropertyValuePath');
jest.mock('../getClassMemberValuePath');
jest.mock('../getMemberExpressionValuePath');

import { expression, statement } from '../../../tests/utils';

import getPropertyValuePath from '../getPropertyValuePath';
import getClassMemberValuePath from '../getClassMemberValuePath';
import getMemberValuePath from '../getMemberValuePath';
import getMemberExpressionValuePath from '../getMemberExpressionValuePath';

describe('getMemberValuePath', () => {
  it('handles ObjectExpressions', () => {
    const path = expression('{}');

    getMemberValuePath(path, 'foo');
    expect(getPropertyValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles ClassDeclarations', () => {
    const path = statement('class Foo {}');

    getMemberValuePath(path, 'foo');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles TaggedTemplateLiterals', () => {
    const path = expression('foo``');

    getMemberValuePath(path, 'foo');
    expect(getMemberExpressionValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles ClassExpressions', () => {
    const path = expression('class {}');

    getMemberValuePath(path, 'foo');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles CallExpressions', () => {
    const path = expression('system({is: "button"}, "space")');

    getMemberValuePath(path, 'foo');
    expect(getMemberExpressionValuePath).toBeCalledWith(path, 'foo');
  });

  it('tries synonyms', () => {
    let path = expression('{}');

    getMemberValuePath(path, 'defaultProps');
    expect(getPropertyValuePath).toBeCalledWith(path, 'defaultProps');
    expect(getPropertyValuePath).toBeCalledWith(path, 'getDefaultProps');

    path = statement('class Foo {}');

    getMemberValuePath(path, 'defaultProps');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'defaultProps');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'getDefaultProps');
  });

  it('returns the result of getPropertyValuePath and getClassMemberValuePath', () => {
    getPropertyValuePath.mockReturnValue(42);
    getClassMemberValuePath.mockReturnValue(21);
    let path = expression('{}');

    expect(getMemberValuePath(path, 'defaultProps')).toBe(42);

    path = statement('class Foo {}');

    expect(getMemberValuePath(path, 'defaultProps')).toBe(21);
  });
});
