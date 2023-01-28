import type {
  TSTypeAliasDeclaration,
  TSTypeParameterDeclaration,
  TSTypeParameterInstantiation,
  TypeAlias,
  TypeParameterDeclaration,
  TypeParameterInstantiation,
} from '@babel/types';
import { parse, parseTypescript } from '../../../tests/utils';
import getTypeParameters from '../getTypeParameters.js';
import { describe, expect, test } from 'vitest';
import type { NodePath } from '@babel/traverse';

describe('getTypeParameters', () => {
  describe('TypeScript', () => {
    test('detects simple type', () => {
      const path =
        parseTypescript.statement<TSTypeAliasDeclaration>('type x<T> = y<T>');

      expect(
        getTypeParameters(
          path.get('typeParameters') as NodePath<TSTypeParameterDeclaration>,
          path
            .get('typeAnnotation')
            .get('typeParameters') as NodePath<TSTypeParameterInstantiation>,
          null,
        ),
      ).toMatchSnapshot();
    });
    test('detects default', () => {
      const path = parseTypescript.statement<TSTypeAliasDeclaration>(
        'type x<T, R = string> = y<T>;',
      );

      expect(
        getTypeParameters(
          path.get('typeParameters') as NodePath<TSTypeParameterDeclaration>,
          path
            .get('typeAnnotation')
            .get('typeParameters') as NodePath<TSTypeParameterInstantiation>,
          null,
        ),
      ).toMatchSnapshot();
    });
  });
  describe('Flow', () => {
    test('detects simple type', () => {
      const path = parse.statement<TypeAlias>('type x<T> = y<T>');

      expect(
        getTypeParameters(
          path.get('typeParameters') as NodePath<TypeParameterDeclaration>,
          path
            .get('right')
            .get('typeParameters') as NodePath<TypeParameterInstantiation>,
          null,
        ),
      ).toMatchSnapshot();
    });
  });
});
