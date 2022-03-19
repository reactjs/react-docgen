import { namedTypes as t } from 'ast-types';
import type { NodePath } from 'ast-types/lib/node-path';

/**
 * Checks if the input Identifier is part of a destructuring Assignment
 * and the name of the property key matches the input name
 */
export default function isDestructuringAssignment(
  path: NodePath,
  name: string,
): boolean {
  return (
    t.Identifier.check(path.node) &&
    t.Property.check(path.parentPath.node) &&
    path.parentPath.node.key.name === name &&
    t.ObjectPattern.check(path.parentPath.parentPath.node)
  );
}
