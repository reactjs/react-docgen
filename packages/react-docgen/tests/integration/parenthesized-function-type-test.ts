import { describe, expect, test } from 'vitest';
import { parse } from '../../src/main';

describe('TypeScript parenthesized function types', () => {
  test('preserves a function type inside a union', () => {
    const [component] = parse(
      `
      interface Props {
        name: (() => string) | undefined;
      }

      export const MyComponent = ({ name }: Props) => <div />;
    `,
      {
        babelOptions: { filename: 'component.tsx' },
      },
    );

    expect(component.props?.name?.tsType).toMatchObject({
      name: 'union',
      elements: [
        {
          name: 'signature',
          type: 'function',
          signature: { arguments: [], return: { name: 'string' } },
        },
        { name: 'undefined' },
      ],
    });
  });
});
