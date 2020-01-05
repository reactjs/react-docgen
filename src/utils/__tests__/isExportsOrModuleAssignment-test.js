/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { statement } from '../../../tests/utils';
import isExportsOrModuleAssignment from '../isExportsOrModuleAssignment';

describe('isExportsOrModuleAssignment', () => {
  it('detects "module.exports = ...;"', () => {
    expect(
      isExportsOrModuleAssignment(statement('module.exports = foo;')),
    ).toBe(true);
  });

  it('detects "exports.foo = ..."', () => {
    expect(isExportsOrModuleAssignment(statement('exports.foo = foo;'))).toBe(
      true,
    );
  });

  it('does not accept "exports = foo;"', () => {
    // That doesn't actually export anything
    expect(isExportsOrModuleAssignment(statement('exports = foo;'))).toBe(
      false,
    );
  });
});
