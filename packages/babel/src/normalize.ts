import { isAstNode, type AstNode } from '@react-docgen/core';

const typeNames: Record<string, string> = {
  ClassPrivateProperty: 'PropertyDefinition',
  ClassProperty: 'PropertyDefinition',
  CommentBlock: 'Block',
  CommentLine: 'Line',
};

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (!value || typeof value !== 'object') return value;

  const input = value as Record<string, unknown>;

  if (input.type === 'File') {
    const program = normalizeValue(input.program);

    if (program && typeof program === 'object') {
      (program as Record<string, unknown>).comments = normalizeValue(
        input.comments,
      );
    }

    return program;
  }

  const output: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(input)) {
    output[key] = normalizeValue(child);
  }

  const originalType = typeof input.type === 'string' ? input.type : '';

  output.type = typeNames[originalType] ?? originalType;
  if (typeof input.start === 'number' && typeof input.end === 'number') {
    output.range = [input.start, input.end];
  }

  return output;
}

export default function normalize(node: unknown): AstNode {
  const normalized = normalizeValue(node);

  if (!isAstNode(normalized)) {
    throw new TypeError('Babel did not return an AST node.');
  }

  return normalized;
}
