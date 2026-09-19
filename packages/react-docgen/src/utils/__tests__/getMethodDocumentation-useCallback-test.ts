import type { NodePath } from '@babel/traverse';
import type { AssignmentExpression, ExpressionStatement } from '@babel/types';
import { parse } from '../../../tests/utils';
import getMethodDocumentation from '../getMethodDocumentation.js';
import { describe, expect, test } from 'vitest';

describe('getMethodDocumentation useCallback', () => {
  test('documents the function a useCallback assignment wraps', () => {
    const method = parse
      .statementLast<ExpressionStatement>(
        `import { useCallback } from 'react';
         const Foo = () => {}
         Foo.foo = useCallback((bar: number): number => bar, [])
        `,
      )
      .get('expression') as NodePath<AssignmentExpression>;

    expect(getMethodDocumentation(method)).toEqual({
      name: 'foo',
      docblock: null,
      modifiers: ['static'],
      returns: { type: { name: 'number' } },
      params: [{ name: 'bar', optional: false, type: { name: 'number' } }],
    });
  });

  test('documents a plain function assignment (control)', () => {
    // Controls for the assignment surface: it documented plain function
    // values before this change, so the case above fails on the unwrapping.
    const method = parse
      .statementLast<ExpressionStatement>(
        `const Foo = () => {}
         Foo.foo = (bar: number): number => bar
        `,
      )
      .get('expression') as NodePath<AssignmentExpression>;

    expect(getMethodDocumentation(method)).toEqual({
      name: 'foo',
      docblock: null,
      modifiers: ['static'],
      returns: { type: { name: 'number' } },
      params: [{ name: 'bar', optional: false, type: { name: 'number' } }],
    });
  });
});
