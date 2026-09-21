import { describe, expect, test } from 'vitest';
import parser from '../parser.js';

describe('parser', () => {
  test('parses JavaScript and Flow syntax', () => {
    const program = parser.parse({
      code: 'type Props = { label: string }; const View = (props: Props) => <div />;',
      filename: 'component.js',
    });

    expect(program.type).toBe('Program');
    expect(program.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'TypeAlias' }),
        expect.objectContaining({ type: 'VariableDeclaration' }),
      ]),
    );
  });

  test('reports unsupported TypeScript files', () => {
    expect(() =>
      parser.parse({ code: 'const value: string = "x";', filename: 'file.ts' }),
    ).toThrow(
      expect.objectContaining({
        code: 'ERR_REACTDOCGEN_PARSER_CAPABILITY',
      }),
    );
  });
});
