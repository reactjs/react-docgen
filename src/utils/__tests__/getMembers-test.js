/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { expression } from '../../../tests/utils';
import getMembers from '../getMembers';

describe('getMembers', () => {
  it('finds all "members" "inside" a MemberExpression', () => {
    const members = getMembers(expression('foo.bar(123)(456)[baz][42]'));

    expect(members).toMatchSnapshot();
  });
});
