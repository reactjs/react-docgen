import type {
  GenericTypeAnnotation,
  Identifier,
  MemberExpression,
  QualifiedTypeIdentifier,
  TSQualifiedName,
  TSTypeAnnotation,
  TypeAnnotation,
  VariableDeclaration,
} from '@babel/types';
import { parse, parseTypescript } from '../../../tests/utils';
import isReactBuiltinReference from '../isReactBuiltinReference.js';
import { describe, expect, test } from 'vitest';
import { NodePath } from '@babel/traverse';

describe('isReactBuiltinReference', () => {
  describe('Commonjs require', () => {
    test('returns true with a MemberExpression', () => {
      const def = parse.expressionLast<MemberExpression>(
        'const React = require("react");React.foo',
      );

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });

    test('returns true with an Identifier', () => {
      const def = parse.expressionLast<Identifier>(
        'const foo = require("react").foo;foo',
      );

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });

    test('returns true with an Identifier and a reassignment', () => {
      const def = parse.expressionLast<Identifier>(
        'let foo; foo = require("react").foo;foo',
      );

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });

    test('returns true with an Identifier and destructuring', () => {
      const def = parse.expressionLast<Identifier>(
        'const { foo } = require("react");foo',
      );

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });
  });

  describe('ESM import', () => {
    test('returns true with a MemberExpression', () => {
      const def = parse.expressionLast<MemberExpression>(
        'import React from "react";React.foo',
      );

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });

    test('returns true with a MemberExpression and namespace import', () => {
      const def = parse.expressionLast<MemberExpression>(
        'import * as React from "react";React.foo',
      );

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });

    test('returns true with an Identifier', () => {
      const def = parse.expressionLast<Identifier>(
        'import { foo } from "react";foo',
      );

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });

    test('returns true with an Identifier and StringIdentifier import', () => {
      const def = parse.expressionLast<Identifier>(
        'import { "foo" as foo } from "react";foo',
      );

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });

    test('returns true with a Flow QualifiedTypeIdentifier', () => {
      const def = (
        parse
          .statementLast<VariableDeclaration>(
            'import React from "react";let x: React.foo',
          )
          .get('declarations')[0]
          .get('id')
          .get('typeAnnotation') as NodePath<TypeAnnotation>
      )
        .get('typeAnnotation')
        .get('id') as NodePath<QualifiedTypeIdentifier>;

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });

    test('returns true with a named import referenced in a flow type', () => {
      const def = (
        parse
          .statementLast<VariableDeclaration>(
            'import { foo } from "react";let x: foo',
          )
          .get('declarations')[0]
          .get('id')
          .get('typeAnnotation') as NodePath<TypeAnnotation>
      )
        .get('typeAnnotation')
        .get('id') as NodePath<Identifier>;

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });

    test('returns true with a TS TSQualifiedName', () => {
      const def = (
        parseTypescript
          .statementLast<VariableDeclaration>(
            'import React from "react";let x: React.foo',
          )
          .get('declarations')[0]
          .get('id')
          .get('typeAnnotation') as NodePath<TSTypeAnnotation>
      )
        .get('typeAnnotation')
        .get('typeName') as NodePath<TSQualifiedName>;

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });

    test('returns true with a named import referenced in a TS type', () => {
      const def = (
        parseTypescript
          .statementLast<VariableDeclaration>(
            'import { foo } from "react";let x: foo',
          )
          .get('declarations')[0]
          .get('id')
          .get('typeAnnotation') as NodePath<TSTypeAnnotation>
      )
        .get('typeAnnotation')
        .get('typeName') as NodePath<Identifier>;

      expect(isReactBuiltinReference(def, 'foo')).toBe(true);
    });
  });
});
