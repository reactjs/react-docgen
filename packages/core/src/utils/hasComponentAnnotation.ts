import { isProgram, type AstNode, type FileState } from '../internal.js';

export default function hasComponentAnnotation(
  file: FileState,
  node: AstNode,
): boolean {
  if (!isProgram(file.ast) || !Array.isArray(node.range)) return false;

  const start = node.range[0];

  return (file.ast.comments ?? []).some(
    (comment) =>
      /(?:^|\s)@component(?:\s|$)/.test(comment.value) &&
      comment.range[1] <= start &&
      /^\s*$/.test(file.source.code.slice(comment.range[1], start)),
  );
}
