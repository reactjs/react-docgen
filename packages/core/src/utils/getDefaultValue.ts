import type {
  AstNode,
  DefaultValueDescriptor,
  FileState,
} from '../internal.js';
import { isIdentifier, isMemberExpression } from '../internal.js';
import resolveValue, { getValueFile } from './resolveValue.js';
import unwrapExpression from './unwrapExpression.js';

export default function getDefaultValue(
  file: FileState,
  node: AstNode,
): DefaultValueDescriptor {
  const wasTypeCast = node.type === 'TypeCastExpression';

  node = unwrapExpression(node);
  if (isIdentifier(node) || isMemberExpression(node)) {
    const resolved = resolveValue(file, node);
    const resolvedFile = getValueFile(file, resolved);

    if (
      resolved !== node &&
      (wasTypeCast || resolvedFile.source.filename !== file.source.filename)
    ) {
      node = resolved;
      file = resolvedFile;
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

  let value = file.source.code.slice(range[0], range[1]);

  if (wasTypeCast && node.type === 'ObjectExpression') {
    const closingIndent = value.match(/\n([ \t]*)}$/)?.[1];

    if (closingIndent) {
      value = value.replaceAll(`\n${closingIndent}`, '\n');
    }
  }

  return {
    computed:
      node.type === 'CallExpression' || node.type === 'MemberExpression',
    value,
  };
}
