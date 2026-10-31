import { isAstNode, type AstNode } from '@react-docgen/core';

export default function normalize(node: unknown): AstNode {
  if (!isAstNode(node)) {
    throw new TypeError('Parser did not return an AST node.');
  }

  return node;
}
