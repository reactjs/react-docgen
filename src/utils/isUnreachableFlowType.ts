import type { NodePath } from '@babel/traverse';

/**
 * Returns true of the path is an unreachable TypePath
 */
export default (path: NodePath): boolean => {
  return (
    !path || // TODO Remove if we are fully typed
    path.isIdentifier() ||
    path.isImportDeclaration() ||
    path.isCallExpression()
  );
};
