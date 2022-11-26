import { parse } from '../../../tests/utils';
import resolveGenericTypeAnnotation from '../resolveGenericTypeAnnotation.js';
import { describe, expect, test } from 'vitest';

describe('resolveGenericTypeAnnotation', () => {
  test('resolves type', () => {
    const code = `
        var x: Props;
        type Props = { x: string };
    `;

    expect(
      resolveGenericTypeAnnotation(
        parse
          .statement(code)
          .get('declarations')[0]
          .get('id')
          .get('typeAnnotation')
          .get('typeAnnotation'),
      ),
    ).toMatchSnapshot();
  });
});
