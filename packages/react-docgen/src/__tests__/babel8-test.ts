import { parse } from '../main.js';
import { expect, test, vi } from 'vitest';

vi.mock('@babel/core', () => import('babel-core-8'));

test('parses components with Babel 8', () => {
  const result = parse('export function Button() { return <button />; }');

  expect(result).toHaveLength(1);
});

test('parses TypeScript function props with Babel 8', () => {
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
