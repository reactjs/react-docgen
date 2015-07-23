/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

import {expression, statement} from '../../../tests/utils';

jest
  .dontMock('../resolveExportDeclaration');


describe('resolveExportDeclaration', () => {
  var returnValue = {};
  var resolveToValue;
  var resolveExportDeclaration;

  beforeEach(() => {
    resolveToValue = require('../resolveToValue');
    resolveToValue.mockReturnValue(returnValue);
    resolveExportDeclaration = require('../resolveExportDeclaration');
  });

  it('resolves default exports', () => {
    var exp = statement('export default 42;');
    var resolved = resolveExportDeclaration(exp);

    expect(resolved).toEqual([returnValue]);
    expect(resolveToValue).toBeCalledWith(exp.get('declaration'));
  });

  it('resolves named exports', () => {
    var exp = statement('export var foo = 42, bar = 21;');
    var resolved = resolveExportDeclaration(exp);

    var declarations = exp.get('declaration', 'declarations');
    expect(resolved).toEqual([returnValue, returnValue]);
    expect(resolveToValue).toBeCalledWith(declarations.get(0));
    expect(resolveToValue).toBeCalledWith(declarations.get(1));

    var exp = statement('export function foo(){}');
    var resolved = resolveExportDeclaration(exp);

    expect(resolved).toEqual([returnValue]);
    expect(resolveToValue).toBeCalledWith(exp.get('declaration'));

    var exp = statement('export class Foo {}');
    var resolved = resolveExportDeclaration(exp);

    expect(resolved).toEqual([returnValue]);
    expect(resolveToValue).toBeCalledWith(exp.get('declaration'));
  });

  it('resolves named exports', () => {
    var exp = statement('export {foo, bar, baz}');
    var resolved = resolveExportDeclaration(exp);

    var specifiers = exp.get('specifiers');
    expect(resolved).toEqual([returnValue, returnValue, returnValue]);
    expect(resolveToValue).toBeCalledWith(specifiers.get(0, 'local'));
    expect(resolveToValue).toBeCalledWith(specifiers.get(1, 'local'));
    expect(resolveToValue).toBeCalledWith(specifiers.get(2, 'local'));
  });
});
