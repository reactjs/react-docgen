import { parse } from '../main.js';
import { expect, test } from 'vitest';

test('parses components', () => {
  const result = parse('export function Button() { return <button />; }');

  expect(result).toHaveLength(1);
});

test('parses TypeScript function props', () => {
  const result = parse(
    `export type MenuProps = {
      onOpenChange?: (open: boolean) => void;
    };

    export function Menu(_props: MenuProps) {
      return <div />;
    }`,
    { filename: 'index.tsx' },
  );

  expect(result[0]?.props?.onOpenChange?.tsType).toEqual({
    name: 'signature',
    type: 'function',
    raw: '(open: boolean) => void',
    signature: {
      arguments: [
        {
          name: 'open',
          type: { name: 'boolean' },
        },
      ],
      return: { name: 'void' },
    },
  });
});

test('parses generic arrow functions in TypeScript files', () => {
  const result = parse(
    `import React from 'react';

    export const mockDomain = <Entity>(
      entities: Record<string, Entity> = {},
    ) => ({ entities });

    export function Button() {
      return React.createElement('button');
    }`,
    { filename: 'store.ts' },
  );

  expect(result).toHaveLength(1);
});

test('parses mapped TypeScript props', () => {
  const result = parse(
    `export type StatusFiltersProps<K extends string = string> = {
      statuses?: { readonly [Key in K]: number };
    };

    export function StatusFilters<K extends string = string>(
      _props: StatusFiltersProps<K>,
    ) {
      return <div />;
    }`,
    { filename: 'index.tsx' },
  );

  expect(result[0]?.props?.statuses?.tsType).toMatchObject({
    name: 'signature',
    type: 'object',
  });
});
