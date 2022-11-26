import type { Node } from '@babel/types';
import match from '../match.js';
import { describe, expect, test } from 'vitest';

describe('match', () => {
  const toASTNode = (obj: Record<string, unknown>): Node => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return obj as any;
  };

  test('matches with exact properties', () => {
    expect(match(toASTNode({ foo: { bar: 42 } }), { foo: { bar: 42 } })).toBe(
      true,
    );
  });

  test('matches a subset of properties in the target', () => {
    expect(
      match(toASTNode({ foo: { bar: 42, baz: 'xyz' } }), { foo: { bar: 42 } }),
    ).toBe(true);
  });

  test('does not match if properties are different/missing', () => {
    expect(
      match(toASTNode({ foo: { bar: 42, baz: 'xyz' } }), {
        foo: { bar: 21, baz: 'xyz' },
      }),
    ).toBe(false);

    expect(
      match(toASTNode({ foo: { baz: 'xyz' } }), {
        foo: { bar: 21, baz: 'xyz' },
      }),
    ).toBe(false);
  });
});
