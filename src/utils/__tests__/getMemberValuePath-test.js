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

import { expression, statement, noopImporter } from '../../../tests/utils';

import getPropertyValuePath from '../getPropertyValuePath';
import getClassMemberValuePath from '../getClassMemberValuePath';
import getMemberValuePath from '../getMemberValuePath';
import getMemberExpressionValuePath from '../getMemberExpressionValuePath';

describe('getMemberValuePath', () => {
  it('handles ObjectExpressions', () => {
    const path = expression('{}');

    getMemberValuePath(path, 'foo', noopImporter);
    expect(getPropertyValuePath).toBeCalledWith(path, 'foo', noopImporter);
  });

  it('handles ClassDeclarations', () => {
    const path = statement('class Foo {}');

    getMemberValuePath(path, 'foo', noopImporter);
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo', noopImporter);
  });

  it('handles TaggedTemplateLiterals', () => {
    const path = expression('foo``');

    getMemberValuePath(path, 'foo', noopImporter);
    expect(getMemberExpressionValuePath).toBeCalledWith(
      path,
      'foo',
      noopImporter,
    );
  });

  it('handles ClassExpressions', () => {
    const path = expression('class {}');

    getMemberValuePath(path, 'foo', noopImporter);
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo', noopImporter);
  });

  it('handles CallExpressions', () => {
    const path = expression('system({is: "button"}, "space")');

    getMemberValuePath(path, 'foo', noopImporter);
    expect(getMemberExpressionValuePath).toBeCalledWith(
      path,
      'foo',
      noopImporter,
    );
  });

  it('tries synonyms', () => {
    let path = expression('{}');

    getMemberValuePath(path, 'defaultProps', noopImporter);
    expect(getPropertyValuePath).toBeCalledWith(
      path,
      'defaultProps',
      noopImporter,
    );
    expect(getPropertyValuePath).toBeCalledWith(
      path,
      'getDefaultProps',
      noopImporter,
    );

    path = statement('class Foo {}');

    getMemberValuePath(path, 'defaultProps', noopImporter);
    expect(getClassMemberValuePath).toBeCalledWith(
      path,
      'defaultProps',
      noopImporter,
    );
    expect(getClassMemberValuePath).toBeCalledWith(
      path,
      'getDefaultProps',
      noopImporter,
    );
  });

  it('returns the result of getPropertyValuePath and getClassMemberValuePath', () => {
    getPropertyValuePath.mockReturnValue(42);
    getClassMemberValuePath.mockReturnValue(21);
    let path = expression('{}');

    expect(getMemberValuePath(path, 'defaultProps', noopImporter)).toBe(42);

    path = statement('class Foo {}');

    expect(getMemberValuePath(path, 'defaultProps', noopImporter)).toBe(21);
  });
});
