import { describe, expect, test } from 'vitest';
import {
  isIdentifier,
  isProgram,
  traverse,
  type AstNode,
} from '@react-docgen/core';
import { parser } from '../index.js';

describe('@react-docgen/typescript', () => {
  test.each([
    [
      'input.js',
      "import value from './value.js'; export const result = value;",
      'ImportDeclaration',
    ],
    ['input.jsx', 'export const View = () => <div />;', 'JSXElement'],
    [
      'input.ts',
      'export type Props = { value: string };',
      'TSTypeAliasDeclaration',
    ],
    [
      'input.tsx',
      'export function View(props: { value: string }) { return <div>{props.value}</div>; }',
      'TSPropertySignature',
    ],
  ])('normalizes and traverses %s', (testFilename, code, expectedType) => {
    const ast = parser.parse({ code, filename: testFilename });
    const nodeTypes: string[] = [];

    traverse(
      ast,
      parser.visitorKeys,
      {
        enter(path, state) {
          state.push(path.node.type);
        },
      },
      nodeTypes,
    );

    expect(isProgram(ast)).toBe(true);
    expect(nodeTypes).toContain('ExportNamedDeclaration');
    expect(nodeTypes).toContain(expectedType);
  });

  test('normalizes parser nodes behind core guards', () => {
    const ast = parser.parse({
      code: 'const answer = 42;',
      filename: 'input.ts',
    });
    const declaration = (ast.body as AstNode[])[0];
    const identifier = (declaration.declarations as AstNode[])[0]
      ?.id as AstNode;

    expect(isIdentifier(identifier, { name: 'answer' })).toBe(true);
  });
});
