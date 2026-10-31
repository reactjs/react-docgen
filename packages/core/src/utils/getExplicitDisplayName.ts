import {
  isAssignmentExpression,
  isExpressionStatement,
  isIdentifier,
  isLiteral,
  isMemberExpression,
  type FileState,
} from '../internal.js';
import getBody from './getBody.js';

export default function getExplicitDisplayName(
  file: FileState,
  componentName: string,
): number | string | null | undefined {
  for (const path of getBody(file)) {
    if (!isExpressionStatement(path.node)) {
      continue;
    }

    const assignment = path.node.expression;

    if (
      !isAssignmentExpression(assignment) ||
      assignment.operator !== '=' ||
      !isMemberExpression(assignment.left) ||
      assignment.left.computed ||
      !isIdentifier(assignment.left.object, { name: componentName }) ||
      !isIdentifier(assignment.left.property, { name: 'displayName' })
    ) {
      continue;
    }

    return isLiteral(assignment.right) &&
      (typeof assignment.right.value === 'string' ||
        typeof assignment.right.value === 'number')
      ? assignment.right.value
      : null;
  }

  return undefined;
}
