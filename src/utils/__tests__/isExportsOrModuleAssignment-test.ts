import { parse } from '../../../tests/utils';
import isExportsOrModuleAssignment from '../isExportsOrModuleAssignment';

describe('isExportsOrModuleAssignment', () => {
  it('detects "module.exports = ...;"', () => {
    expect(
      isExportsOrModuleAssignment(parse.statement('module.exports = foo;')),
    ).toBe(true);
  });

  it('detects "exports.foo = ..."', () => {
    expect(
      isExportsOrModuleAssignment(parse.statement('exports.foo = foo;')),
    ).toBe(true);
  });

  it('does not accept "exports = foo;"', () => {
    // That doesn't actually export anything
    expect(isExportsOrModuleAssignment(parse.statement('exports = foo;'))).toBe(
      false,
    );
  });
});
