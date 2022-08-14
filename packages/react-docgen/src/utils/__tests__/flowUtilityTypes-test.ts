import { unwrapUtilityType, isSupportedUtilityType } from '../flowUtilityTypes';
import { parse } from '../../../tests/utils';
import type { NodePath } from '@babel/traverse';
import type { GenericTypeAnnotation, TypeAlias } from '@babel/types';

describe('flowTypeUtilities', () => {
  describe('unwrapUtilityType', () => {
    it('correctly unwraps', () => {
      const def = parse.statement<TypeAlias>(`
        type A = $ReadOnly<{ foo: string }>
      `);

      expect(unwrapUtilityType(def.get('right'))).toBe(
        (def.get('right') as NodePath<GenericTypeAnnotation>)
          .get('typeParameters')
          .get('params')[0],
      );
    });

    it('correctly unwraps double', () => {
      const def = parse.statement<TypeAlias>(`
        type A = $ReadOnly<$ReadOnly<{ foo: string }>>
      `);

      expect(unwrapUtilityType(def.get('right'))).toBe(
        (
          (def.get('right') as NodePath<GenericTypeAnnotation>)
            .get('typeParameters')
            .get('params')[0] as NodePath<GenericTypeAnnotation>
        )
          .get('typeParameters')
          .get('params')[0],
      );
    });

    it('correctly unwraps triple', () => {
      const def = parse.statement<TypeAlias>(`
        type A = $ReadOnly<$ReadOnly<$ReadOnly<{ foo: string }>>>
      `);

      expect(unwrapUtilityType(def.get('right'))).toBe(
        (
          (
            (def.get('right') as NodePath<GenericTypeAnnotation>)
              .get('typeParameters')
              .get('params')[0] as NodePath<GenericTypeAnnotation>
          )
            .get('typeParameters')
            .get('params')[0] as NodePath<GenericTypeAnnotation>
        )
          .get('typeParameters')
          .get('params')[0],
      );
    });
  });

  describe('isSupportedUtilityType', () => {
    it('correctly returns true for $Exact', () => {
      const def = parse.statement<TypeAlias>(`
        type A = $Exact<{ foo: string }>
      `);

      expect(isSupportedUtilityType(def.get('right'))).toBe(true);
    });

    it('correctly returns true for $ReadOnly', () => {
      const def = parse.statement<TypeAlias>(`
        type A = $ReadOnly<{ foo: string }>
      `);

      expect(isSupportedUtilityType(def.get('right'))).toBe(true);
    });

    it('correctly returns false for invalid type', () => {
      const def = parse.statement<TypeAlias>(`
        type A = $Homer<{ foo: string }>
      `);

      expect(isSupportedUtilityType(def.get('right'))).toBe(false);
    });

    it('correctly returns false for QualifiedTypeIdentifier', () => {
      const def = parse.statement<TypeAlias>(`
        type A = $Homer.Marge<{ foo: string }>
      `);

      expect(isSupportedUtilityType(def.get('right'))).toBe(false);
    });
  });
});
