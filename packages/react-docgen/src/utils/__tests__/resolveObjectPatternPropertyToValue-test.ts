import type { NodePath } from '@babel/traverse';
import type {
  AssignmentExpression,
  ObjectExpression,
  ObjectProperty,
  VariableDeclaration,
} from '@babel/types';
import { parse } from '../../../tests/utils';
import resolveObjectPatternPropertyToValue from '../resolveObjectPatternPropertyToValue.js';
import { describe, expect, test } from 'vitest';

describe('resolveObjectPatternPropertyToValue', () => {
  test('does not resolve if not in ObjectProperty', () => {
    const path = parse
      .expressionLast<ObjectExpression>(
        `const x = { a : "string" };
         ({ a })`,
      )
      .get('properties.0') as NodePath<ObjectProperty>;

    expect(resolveObjectPatternPropertyToValue(path)).toBeNull();
  });

  test('does not resolve if not in VariableDeclarator or AssignmentExpression', () => {
    const path = parse
      .expression<ObjectExpression>(`({ a }) => {}`)
      .get('params.0.properties.0') as NodePath<ObjectProperty>;

    expect(resolveObjectPatternPropertyToValue(path)).toBeNull();
  });

  describe('VariableDeclarator', () => {
    test('resolved basic case', () => {
      const path = parse
        .statementLast<VariableDeclaration>(
          `const x = { a : "string" };
         const { a } = x;`,
        )
        .get('declarations.0.id.properties.0') as NodePath<ObjectProperty>;

      expect(resolveObjectPatternPropertyToValue(path)).toMatchSnapshot();
    });

    test('does not resolve if property not found', () => {
      const path = parse
        .statementLast<VariableDeclaration>(
          `const x = { b : "string" };
         const { a } = x;`,
        )
        .get('declarations.0.id.properties.0') as NodePath<ObjectProperty>;

      expect(resolveObjectPatternPropertyToValue(path)).toBeNull();
    });

    test('does not resolve when init not resolvable', () => {
      const path = parse
        .statementLast<VariableDeclaration>(`const { a } = x;`)
        .get('declarations.0.id.properties.0') as NodePath<ObjectProperty>;

      expect(resolveObjectPatternPropertyToValue(path)).toBeNull();
    });
  });
  describe('AssignmentExpression', () => {
    test('resolved basic case', () => {
      const path = parse
        .expressionLast<AssignmentExpression>(
          `const x = { a : "string" };
           ({ a } = x)`,
        )
        .get('left.properties.0') as NodePath<ObjectProperty>;

      expect(resolveObjectPatternPropertyToValue(path)).toMatchSnapshot();
    });

    test('does not resolve if property not found', () => {
      const path = parse
        .expressionLast<AssignmentExpression>(
          `const x = { b : "string" };
           ({ a } = x)`,
        )
        .get('left.properties.0') as NodePath<ObjectProperty>;

      expect(resolveObjectPatternPropertyToValue(path)).toBeNull();
    });

    test('does not resolve when init not resolvable', () => {
      const path = parse
        .expression<AssignmentExpression>(`{ a } = x`)
        .get('left.properties.0') as NodePath<ObjectProperty>;

      expect(resolveObjectPatternPropertyToValue(path)).toBeNull();
    });
  });
});
