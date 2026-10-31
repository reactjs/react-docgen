import {
  isProgram,
  type AstNode,
  type Comment,
  type FileState,
} from '../internal.js';

export default function getDescription(file: FileState, node: AstNode): string {
  if (!isProgram(file.ast) || !('range' in node)) {
    return '';
  }

  const start = (node.range as readonly [number, number])[0];
  const comments = (file.ast.comments ?? []).filter(
    (comment): comment is Comment =>
      comment.type === 'Block' &&
      comment.value.startsWith('*') &&
      comment.range[1] <= start &&
      /^[\s,;]*$/.test(file.source.code.slice(comment.range[1], start)),
  );
  const comment = comments.at(-1);

  return comment
    ? comment.value
        .split('\n')
        .map((line) => line.replace(/^\s*\* ?/, ''))
        .join('\n')
        .trim()
    : '';
}
