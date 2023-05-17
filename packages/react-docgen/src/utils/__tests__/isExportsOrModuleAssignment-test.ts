import { parse } from '../../../tests/utils';
import isExportsOrModuleAssignment from '../isExportsOrModuleAssignment.js';
import { describe, expect, test } from 'vitest';

describe('isExportsOrModuleAssignment', () => {
  test('detects "module.exports = ...;"', () => {
    expect(
      isExportsOrModuleAssignment(parse.expression('module.exports = foo')),
    ).toBe(true);
  });

  test('detects "exports.foo = ..."', () => {
    expect(
      isExportsOrModuleAssignment(parse.expression('exports.foo = foo')),
    ).toBe(true);
  });

  test('does not accept "exports = foo;"', () => {
    // That doesn't actually export anything
    expect(isExportsOrModuleAssignment(parse.expression('exports = foo'))).toBe(
      false,
    );
  });
});
