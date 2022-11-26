import { parse } from '../../../tests/utils';
import isRequiredPropType from '../isRequiredPropType.js';
import { describe, expect, test } from 'vitest';

describe('isRequiredPropType', () => {
  test('considers isRequired', () => {
    expect(isRequiredPropType(parse.expression('foo.bar.isRequired'))).toEqual(
      true,
    );
    expect(isRequiredPropType(parse.expression('foo.isRequired.bar'))).toEqual(
      true,
    );
  });

  test('considers ["isRequired"]', () => {
    expect(
      isRequiredPropType(parse.expression('foo.bar["isRequired"]')),
    ).toEqual(true);
    expect(
      isRequiredPropType(parse.expression('foo["isRequired"].bar')),
    ).toEqual(true);
  });

  test('ignores variables', () => {
    expect(isRequiredPropType(parse.expression('foo.bar[isRequired]'))).toEqual(
      false,
    );
  });
});
