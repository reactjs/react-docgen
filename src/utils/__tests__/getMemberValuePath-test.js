/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, xdescribe, beforeEach, it, expect*/

jest
  .dontMock('../getMemberValuePath.js');

describe('getMemberValuePath', () => {
  var getMemberValuePath;
  var expression, statement;

  beforeEach(() => {
    ({expression, statement} = require('../../../tests/utils'));
    getMemberValuePath = require('../getMemberValuePath');
  });

  it('handles ObjectExpresisons', () => {
    var getPropertyValuePath = require('../getPropertyValuePath');
    var path = expression('{}');

    getMemberValuePath(path, 'foo');
    expect(getPropertyValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles ClassDeclarations', () => {
    var getClassMemberValuePath = require('../getClassMemberValuePath');
    var path = statement('class Foo {}');

    getMemberValuePath(path, 'foo');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo');
  });

  it('handles ClassExpressions', () => {
    var getClassMemberValuePath = require('../getClassMemberValuePath');
    var path = expression('class {}');

    getMemberValuePath(path, 'foo');
    expect(getClassMemberValuePath).toBeCalledWith(path, 'foo');
  });

  it('tries synonyms', () => {
    var getPropertyValuePath = require('../getPropertyValuePath');
    var getClassMemberValuePath = require('../getClassMemberValuePath');
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
    var getPropertyValuePath = require('../getPropertyValuePath');
    var getClassMemberValuePath = require('../getClassMemberValuePath');
    getPropertyValuePath.mockReturnValue(42);
    getClassMemberValuePath.mockReturnValue(21);
    var path = expression('{}');

    expect(getMemberValuePath(path, 'defaultProps')).toBe(42);

    path = statement('class Foo {}');

    expect(getMemberValuePath(path, 'defaultProps')).toBe(21);
  });
});
