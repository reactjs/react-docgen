import isReactModuleName from '../isReactModuleName.js';
import { describe, expect, test } from 'vitest';

describe('isReactModuleName', () => {
  const reactModules = [
    'react',
    'react/addons',
    'react-native',
    'proptypes',
    'prop-types',
  ];

  reactModules.forEach((module) => {
    test(`returns true for ${module}`, () => {
      expect(isReactModuleName(module)).toBe(true);
    });
  });

  test(`returns false by default`, () => {
    expect(isReactModuleName('not-react')).toBe(false);
  });
});
