import { isAstNode, type AstNode } from '@react-docgen/core';

const typeNames: Record<string, string> = {
  BigIntLiteral: 'Literal',
  BooleanLiteral: 'Literal',
  ClassMethod: 'MethodDefinition',
  ClassPrivateMethod: 'MethodDefinition',
  ClassPrivateProperty: 'PropertyDefinition',
  ClassProperty: 'PropertyDefinition',
  CommentBlock: 'Block',
  CommentLine: 'Line',
  DecimalLiteral: 'Literal',
  NullLiteral: 'Literal',
  NumericLiteral: 'Literal',
  ObjectMethod: 'Property',
  ObjectProperty: 'Property',
  RegExpLiteral: 'Literal',
  StringLiteral: 'Literal',
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

  if (output.type === 'Literal') {
    output.raw =
      input.extra && typeof input.extra === 'object' && 'raw' in input.extra
        ? (input.extra as { raw: unknown }).raw
        : originalType === 'NullLiteral'
          ? 'null'
          : input.value;
    if (originalType === 'NullLiteral') output.value = null;
  }

  if (originalType === 'ObjectMethod') {
    output.value = {
      type: 'FunctionExpression',
      range: output.range,
      params: output.params,
      body: output.body,
      async: output.async,
      generator: output.generator,
      returnType: output.returnType,
    };
  }

  if (originalType === 'ClassMethod' || originalType === 'ClassPrivateMethod') {
    output.value = {
      type: 'FunctionExpression',
      range: output.range,
      params: output.params,
      body: output.body,
      async: output.async,
      generator: output.generator,
      returnType: output.returnType,
    };
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
