import { parse } from '../../../tests/utils';
import isRequiredPropType from '../isRequiredPropType';

describe('isRequiredPropType', () => {
  it('considers isRequired', () => {
    expect(isRequiredPropType(parse.expression('foo.bar.isRequired'))).toEqual(
      true,
    );
    expect(isRequiredPropType(parse.expression('foo.isRequired.bar'))).toEqual(
      true,
    );
  });

  it('considers ["isRequired"]', () => {
    expect(
      isRequiredPropType(parse.expression('foo.bar["isRequired"]')),
    ).toEqual(true);
    expect(
      isRequiredPropType(parse.expression('foo["isRequired"].bar')),
    ).toEqual(true);
  });

  it('ignores variables', () => {
    expect(isRequiredPropType(parse.expression('foo.bar[isRequired]'))).toEqual(
      false,
    );
  });
});
