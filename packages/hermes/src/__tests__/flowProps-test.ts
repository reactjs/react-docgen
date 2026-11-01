import { describe, expect, test } from 'vitest';
import { parse } from '../index.js';

describe('Flow props', () => {
  test.each([
    'export default class View extends React.Component<Props> { render() { return null; } }',
    'const View = class extends React.Component<Props> { render() { return null; } }; export default View;',
    'export default function View(props: Props) { return null; }',
  ])('preserves tuple and primitive types in %s', (component) => {
    const [documentation] = parse(`
      import React from 'react';
      type Props = {
        pair: [string, number],
        unknownValue: unknown,
        neverValue: never,
        undefinedValue: undefined,
      };
      ${component}
    `);

    expect(documentation?.props).toMatchObject({
      pair: {
        flowType: {
          name: 'tuple',
          elements: [{ name: 'string' }, { name: 'number' }],
        },
      },
      unknownValue: { flowType: { name: 'unknown' } },
      neverValue: { flowType: { name: 'never' } },
      undefinedValue: { flowType: { name: 'undefined' } },
    });
  });
});
