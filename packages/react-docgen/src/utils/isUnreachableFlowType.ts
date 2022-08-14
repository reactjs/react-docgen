import type { NodePath } from '@babel/traverse';

/**
 * Returns true of the path is an unreachable TypePath
 */
export default (path: NodePath): boolean => {
  return (
    path.isIdentifier() || path.isImportDeclaration() || path.isCallExpression()
  );
};
