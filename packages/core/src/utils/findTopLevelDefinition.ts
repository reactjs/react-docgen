import {
  isAssignmentExpression,
  isClassDeclaration,
  isFunctionDeclaration,
  isExpressionStatement,
  isIdentifier,
  isVariableDeclaration,
  isVariableDeclarator,
  type AstPath,
  type FileState,
} from '../internal.js';
import getBody from './getBody.js';

export default function findTopLevelDefinition(
  file: FileState,
  name: string,
): AstPath | null {
  for (const path of getBody(file)) {
    if (
      (isFunctionDeclaration(path.node) || isClassDeclaration(path.node)) &&
      path.node.id?.name === name
    ) {
      return path;
    }

    if (!isVariableDeclaration(path.node)) {
      if (!isExpressionStatement(path.node)) {
        continue;
      }

      const expression = path.node.expression;

      if (
        !isAssignmentExpression(expression) ||
        !isIdentifier(expression.left, { name })
      ) {
        continue;
      }

      const expressionPath = path.get('expression');
      const rightPath =
        expressionPath && !Array.isArray(expressionPath)
          ? expressionPath.get('right')
          : null;

      if (rightPath && !Array.isArray(rightPath)) {
        return rightPath;
      }

      continue;
    }

    const declarations = path.get('declarations');

    if (!Array.isArray(declarations)) {
      continue;
    }

    for (const declaration of declarations) {
      if (
        !isVariableDeclarator(declaration.node) ||
        !isIdentifier(declaration.node.id, { name })
      ) {
        continue;
      }

      const init = declaration.get('init');

      if (init && !Array.isArray(init)) {
        return init;
      }
    }
  }

  return null;
}
