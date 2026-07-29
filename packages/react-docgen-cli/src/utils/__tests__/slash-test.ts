/*
Based on npm slash package: https://www.npmjs.com/package/slash
Licensed under MIT License
Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
*/

import { describe, expect, test } from 'vitest';
import slash from '../slash';

describe('slash', () => {
  test('convert backwards-slash paths to forward slash paths', () => {
    expect(slash('c:/aaaa\\bbbb')).toBe('c:/aaaa/bbbb');
    expect(slash('c:\\aaaa\\bbbb')).toBe('c:/aaaa/bbbb');
    expect(slash('c:\\aaaa\\bbbb\\★')).toBe('c:/aaaa/bbbb/★');
  });

  test('not convert extended-length paths', () => {
    const path = '\\\\?\\c:\\aaaa\\bbbb';

    expect(slash(path)).toBe(path);
  });
});
