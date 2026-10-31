import {
  isTSBooleanKeyword,
  isTSStringKeyword,
  isTSTypeAnnotation,
  type AstNode,
} from '@react-docgen/core';

export default function getTypeName(node: AstNode | undefined): string | null {
  if (!node || !isTSTypeAnnotation(node)) {
    return null;
  }

  if (isTSStringKeyword(node.typeAnnotation)) {
    return 'string';
  }

  if (isTSBooleanKeyword(node.typeAnnotation)) {
    return 'boolean';
  }

  return null;
}
