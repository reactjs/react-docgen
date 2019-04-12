/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*global jest, describe, beforeEach, it, expect*/

jest.disableAutomock();

describe('isExportsOrModuleAssignment', () => {
  let recast;
  let isExportsOrModuleAssignment;

  function parse(src) {
    return new recast.types.NodePath(recast.parse(src).program.body[0]);
  }

  beforeEach(() => {
    isExportsOrModuleAssignment = require('../isExportsOrModuleAssignment')
      .default;
    recast = require('recast');
  });

  it('detects "module.exports = ...;"', () => {
    expect(isExportsOrModuleAssignment(parse('module.exports = foo;'))).toBe(
      true,
    );
  });

  it('detects "exports.foo = ..."', () => {
    expect(isExportsOrModuleAssignment(parse('exports.foo = foo;'))).toBe(true);
  });

  it('does not accept "exports = foo;"', () => {
    // That doesn't actually export anything
    expect(isExportsOrModuleAssignment(parse('exports = foo;'))).toBe(false);
  });
});
