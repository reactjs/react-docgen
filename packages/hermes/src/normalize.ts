import { isAstNode, type AstNode } from '@react-docgen/core';

const typeNames: Record<string, string> = {
  BigIntLiteral: 'Literal',
  BooleanLiteral: 'Literal',
  ClassProperty: 'PropertyDefinition',
  NullLiteral: 'Literal',
  NumericLiteral: 'Literal',
  RegExpLiteral: 'Literal',
  StringLiteral: 'Literal',
};

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (!value || typeof value !== 'object') return value;

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(input)) {
    output[key] = normalizeValue(child);
  }

  const originalType = typeof input.type === 'string' ? input.type : '';

  output.type = typeNames[originalType] ?? originalType;

  if (output.type === 'Literal' && output.raw === undefined) {
    output.raw = originalType === 'NullLiteral' ? 'null' : input.value;
  }

  return output;
}

export default function normalize(node: unknown): AstNode {
  const normalized = normalizeValue(node);

  if (!isAstNode(normalized)) {
    throw new TypeError('Hermes did not return an AST node.');
  }

  return normalized;
}
