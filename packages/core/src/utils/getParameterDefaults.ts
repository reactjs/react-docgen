import {
  isAssignmentPattern,
  isIdentifier,
  isProperty,
  type AstNode,
  type ObjectPattern,
} from '../internal.js';

export default function getParameterDefaults(
  pattern: ObjectPattern | null,
): Map<string, AstNode> {
  const defaults = new Map<string, AstNode>();

  for (const property of pattern?.properties ?? []) {
    if (
      isProperty(property) &&
      isIdentifier(property.key) &&
      isAssignmentPattern(property.value)
    ) {
      defaults.set(property.key.name, property.value.right);
    }
  }

  return defaults;
}
