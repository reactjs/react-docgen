/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, it, expect*/

jest.mock('../getPropertyValuePath');
jest.mock('../getClassMemberValuePath');

import {expression, statement} from '../../../tests/utils';

import getPropertyValuePath from '../getPropertyValuePath';
import getClassMemberValuePath from '../getClassMemberValuePath';
import getMemberValuePath from '../getMemberValuePath';

describe('getMemberValuePath', () => {

  it('handles ObjectExpresisons', () => {
    var path = expression('{}');

    getMemberValuePath(path, 'foo');
    expect(getPropertyValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles ClassDeclarations', () => {
    var path = statement('class Foo {}');

    getMemberValuePath(path, 'foo');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles ClassExpressions', () => {
    var path = expression('class {}');

    getMemberValuePath(path, 'foo');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo');
  });

  it('tries synonyms', () => {
    var path = expression('{}');

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
    var path = expression('{}');

    expect(getMemberValuePath(path, 'defaultProps')).toBe(42);

    path = statement('class Foo {}');

    expect(getMemberValuePath(path, 'defaultProps')).toBe(21);
  });

});
