import { unwrapUtilityType, isSupportedUtilityType } from '../flowUtilityTypes';
import { statement } from '../../../tests/utils';

describe('flowTypeUtilities', () => {
  describe('unwrapUtilityType', () => {
    it('correctly unwraps', () => {
      const def = statement(`
        type A = $ReadOnly<{ foo: string }>
      `);

      expect(unwrapUtilityType(def.get('right'))).toBe(
        def.get('right', 'typeParameters', 'params', 0),
      );
    });

    it('correctly unwraps double', () => {
      const def = statement(`
        type A = $ReadOnly<$ReadOnly<{ foo: string }>>
      `);

      expect(unwrapUtilityType(def.get('right'))).toBe(
        def.get(
          'right',
          'typeParameters',
          'params',
          0,
          'typeParameters',
          'params',
          0,
        ),
      );
    });

    it('correctly unwraps triple', () => {
      const def = statement(`
        type A = $ReadOnly<$ReadOnly<$ReadOnly<{ foo: string }>>>
      `);

      expect(unwrapUtilityType(def.get('right'))).toBe(
        def.get(
          'right',
          'typeParameters',
          'params',
          0,
          'typeParameters',
          'params',
          0,
          'typeParameters',
          'params',
          0,
        ),
      );
    });
  });

  describe('isSupportedUtilityType', () => {
    it('correctly returns true for valid type', () => {
      const def = statement(`
        type A = $Exact<{ foo: string }>
      `);

      expect(isSupportedUtilityType(def.get('right'))).toBe(true);
    });

    it('correctly returns false for invalid type', () => {
      const def = statement(`
        type A = $Homer<{ foo: string }>
      `);

      expect(isSupportedUtilityType(def.get('right'))).toBe(false);
    });
  });
});
