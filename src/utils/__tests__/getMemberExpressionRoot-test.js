/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expression } from '../../../tests/utils';
import getMemberExpressionRoot from '../getMemberExpressionRoot';

describe('getMemberExpressionRoot', () => {
  it('returns the root of a member expression', () => {
    const root = getMemberExpressionRoot(expression('foo.bar.baz'));
    expect(root).toEqualASTNode(expression('foo'));
  });
});
