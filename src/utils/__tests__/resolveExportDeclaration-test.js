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

jest.mock('../resolveToValue');

import { statement } from '../../../tests/utils';

import resolveToValue from '../resolveToValue';
import resolveExportDeclaration from '../resolveExportDeclaration';

describe('resolveExportDeclaration', () => {
  const returnValue = {};

  beforeEach(() => {
    resolveToValue.mockReturnValue(returnValue);
  });

  it('resolves default exports', () => {
    const exp = statement('export default 42;');
    const resolved = resolveExportDeclaration(exp);

    expect(resolved).toEqual([returnValue]);
    expect(resolveToValue).toBeCalledWith(exp.get('declaration'));
  });

  it('resolves named exports', () => {
    let exp = statement('export var foo = 42, bar = 21;');
    let resolved = resolveExportDeclaration(exp);

    const declarations = exp.get('declaration', 'declarations');
    expect(resolved).toEqual([returnValue, returnValue]);
    expect(resolveToValue).toBeCalledWith(declarations.get(0));
    expect(resolveToValue).toBeCalledWith(declarations.get(1));

    exp = statement('export function foo(){}');
    resolved = resolveExportDeclaration(exp);

    expect(resolved).toEqual([returnValue]);
    expect(resolveToValue).toBeCalledWith(exp.get('declaration'));

    exp = statement('export class Foo {}');
    resolved = resolveExportDeclaration(exp);

    expect(resolved).toEqual([returnValue]);
    expect(resolveToValue).toBeCalledWith(exp.get('declaration'));
  });

  it('resolves named exports', () => {
    const exp = statement('export {foo, bar, baz}');
    const resolved = resolveExportDeclaration(exp);

    const specifiers = exp.get('specifiers');
    expect(resolved).toEqual([returnValue, returnValue, returnValue]);
    expect(resolveToValue).toBeCalledWith(specifiers.get(0, 'local'));
    expect(resolveToValue).toBeCalledWith(specifiers.get(1, 'local'));
    expect(resolveToValue).toBeCalledWith(specifiers.get(2, 'local'));
  });
});
