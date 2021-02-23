import { namedTypes as t } from 'ast-types';
import type { NodePath } from 'ast-types/lib/node-path';

/**
 * Returns true of the path is an unreachable TypePath
 */
export default (path: NodePath): boolean => {
  return (
    !path ||
    t.Identifier.check(path.node) ||
    t.ImportDeclaration.check(path.node) ||
    t.CallExpression.check(path.node)
  );
};
