import type {
  AstNode,
  DefaultValueDescriptor,
  FileState,
} from '../internal.js';
import { isIdentifier, isMemberExpression } from '../internal.js';
import resolveValue, { getValueFile } from './resolveValue.js';

export default function getDefaultValue(
  file: FileState,
  node: AstNode,
): DefaultValueDescriptor {
  if (isIdentifier(node) || isMemberExpression(node)) {
    const original = node;
    const resolved = resolveValue(file, node);
    const resolvedFile = getValueFile(file, resolved);

    if (resolvedFile.source.filename !== file.source.filename) {
      node = resolved;
      file = resolvedFile;
    } else {
      node = original;
    }
  }
  file = getValueFile(file, node);
  const range = node.range;

  if (
    !Array.isArray(range) ||
    typeof range[0] !== 'number' ||
    typeof range[1] !== 'number'
  ) {
    return { computed: true, value: '' };
  }

  return {
    computed:
      node.type === 'CallExpression' || node.type === 'MemberExpression',
    value: file.source.code.slice(range[0], range[1]),
  };
}
