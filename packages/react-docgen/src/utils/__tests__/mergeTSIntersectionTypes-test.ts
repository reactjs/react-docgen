import { describe, expect, test } from 'vitest';
import mergeTSIntersectionTypes from '../mergeTSIntersectionTypes.js';

describe('mergeTSIntersectionTypes', () => {
  test('it merges two types correctly', () => {
    const mergedType = mergeTSIntersectionTypes(
      {
        name: 'string',
        required: true,
      },
      {
        name: 'number',
        required: true,
      },
    );

    expect(mergedType).toEqual({
      name: 'string | number',
      required: true,
    });
  });

  test('it ignores types of "never"', () => {
    const mergedType = mergeTSIntersectionTypes(
      {
        name: 'string',
        required: true,
      },
      {
        name: 'never',
        required: true,
      },
    );

    expect(mergedType).toEqual({
      name: 'string',
      required: true,
    });
  });

  test('if one of the types is "unknown", it overrides all other types', () => {
    const mergedType = mergeTSIntersectionTypes(
      {
        name: 'string',
        required: true,
      },
      {
        name: 'unknown',
        required: true,
      },
    );

    expect(mergedType).toEqual({
      name: 'unknown',
      required: true,
    });
  });

  test('if one of the types is NOT required, the merged one is NOT required too', () => {
    const mergedType = mergeTSIntersectionTypes(
      {
        name: 'string',
        required: true,
      },
      {
        name: 'number',
        required: false,
      },
    );

    expect(mergedType).toEqual({
      name: 'string | number',
      required: false,
    });
  });
});
