import { parse } from '../main.js';
import { expect, test, vi } from 'vitest';

vi.mock('@babel/core', () => import('babel-core-8'));

test('parses components with Babel 8', () => {
  const result = parse('export function Button() { return <button />; }');

  expect(result).toHaveLength(1);
});
