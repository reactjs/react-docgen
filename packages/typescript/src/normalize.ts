import { isAstNode, type AstNode } from '@react-docgen/core';

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const normalized: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(value)) {
    normalized[key] = normalizeValue(child);
  }

  return normalized;
}

export default function normalize(node: unknown): AstNode {
  const normalized = normalizeValue(node);

  if (!isAstNode(normalized)) {
    throw new TypeError('Parser did not return an AST node.');
  }

  return normalized;
}
