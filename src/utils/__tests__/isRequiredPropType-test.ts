import { expression } from '../../../tests/utils';
import isRequiredPropType from '../isRequiredPropType';

describe('isRequiredPropType', () => {
  it('considers isRequired', () => {
    expect(isRequiredPropType(expression('foo.bar.isRequired'))).toEqual(true);
    expect(isRequiredPropType(expression('foo.isRequired.bar'))).toEqual(true);
  });

  it('considers ["isRequired"]', () => {
    expect(isRequiredPropType(expression('foo.bar["isRequired"]'))).toEqual(
      true,
    );
    expect(isRequiredPropType(expression('foo["isRequired"].bar'))).toEqual(
      true,
    );
  });

  it('ignores variables', () => {
    expect(isRequiredPropType(expression('foo.bar[isRequired]'))).toEqual(
      false,
    );
  });
});
