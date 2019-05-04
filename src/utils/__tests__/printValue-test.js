/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { parse } from '../../../tests/utils';
import printValue from '../printValue';

describe('printValue', () => {
  function pathFromSource(source) {
    return parse(source).get('body', 0, 'expression');
  }

  it('does not print leading comments', () => {
    expect(printValue(pathFromSource('//foo\nbar'))).toEqual('bar');
  });

  it('does not print trailing comments', () => {
    expect(printValue(pathFromSource('bar//foo'))).toEqual('bar');
  });
});
