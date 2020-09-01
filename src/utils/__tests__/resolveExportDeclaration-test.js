/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

jest.mock('../resolveToValue');

import { statement } from '../../../tests/utils';
import resolveToValue from '../resolveToValue';
import resolveExportDeclaration from '../resolveExportDeclaration';

describe('resolveExportDeclaration', () => {
  const returnValue = {};
  const ignoreImports = () => null;

  beforeEach(() => {
    resolveToValue.mockReturnValue(returnValue);
  });

  it('resolves default exports', () => {
    const exp = statement('export default 42;');
    const resolved = resolveExportDeclaration(exp, ignoreImports);

    expect(resolved).toEqual([returnValue]);
    expect(resolveToValue).toBeCalledWith(exp.get('declaration'), ignoreImports);
  });

  it('resolves named exports', () => {
    let exp = statement('export var foo = 42, bar = 21;');
    let resolved = resolveExportDeclaration(exp, ignoreImports);

    const declarations = exp.get('declaration', 'declarations');
    expect(resolved).toEqual([returnValue, returnValue]);
    expect(resolveToValue).toBeCalledWith(declarations.get(0), ignoreImports);
    expect(resolveToValue).toBeCalledWith(declarations.get(1), ignoreImports);

    exp = statement('export function foo(){}');
    resolved = resolveExportDeclaration(exp, ignoreImports);

    expect(resolved).toEqual([returnValue]);
    expect(resolveToValue).toBeCalledWith(exp.get('declaration'), ignoreImports);

    exp = statement('export class Foo {}');
    resolved = resolveExportDeclaration(exp, ignoreImports);

    expect(resolved).toEqual([returnValue]);
    expect(resolveToValue).toBeCalledWith(exp.get('declaration'), ignoreImports);
  });

  it('resolves named exports', () => {
    const exp = statement('export {foo, bar, baz}; var foo, bar, baz;');
    const resolved = resolveExportDeclaration(exp, ignoreImports);

    const specifiers = exp.get('specifiers');
    expect(resolved).toEqual([returnValue, returnValue, returnValue]);
    expect(resolveToValue).toBeCalledWith(specifiers.get(0, 'local'), ignoreImports);
    expect(resolveToValue).toBeCalledWith(specifiers.get(1, 'local'), ignoreImports);
    expect(resolveToValue).toBeCalledWith(specifiers.get(2, 'local'), ignoreImports);
  });
});
