import {
  isAssignmentExpression,
  isClassDeclaration,
  isClassExpression,
  isCallExpression,
  isArrowFunctionExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isVariableDeclarator,
  type AstPath,
} from '../internal.js';

export default function getComponentName(path: AstPath): string | null {
  if (
    (isFunctionDeclaration(path.node) || isClassDeclaration(path.node)) &&
    path.node.id
  ) {
    return path.node.id.name;
  }

  if (
    isArrowFunctionExpression(path.node) ||
    isFunctionExpression(path.node) ||
    isClassExpression(path.node) ||
    isCallExpression(path.node)
  ) {
    for (let parent = path.parentPath; parent; parent = parent.parentPath) {
      if (isVariableDeclarator(parent.node) && isIdentifier(parent.node.id)) {
        return parent.node.id.name;
      }

      if (
        isAssignmentExpression(parent.node) &&
        isIdentifier(parent.node.left)
      ) {
        return parent.node.left.name;
      }
    }
  }

  return null;
}
