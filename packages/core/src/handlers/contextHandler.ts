import {
  isAssignmentExpression,
  isExpressionStatement,
  isIdentifier,
  isMemberExpression,
  isObjectExpression,
  isProperty,
  type Handler,
} from '../internal.js';
import getBody from '../utils/getBody.js';
import getComponentName from '../utils/getComponentName.js';
import getPropType from '../utils/getPropType.js';

const contextHandler: Handler = (documentation, path, file) => {
  const componentName = getComponentName(path);

  if (!componentName) {
    return;
  }

  for (const statement of getBody(file)) {
    if (!isExpressionStatement(statement.node)) {
      continue;
    }

    const assignment = statement.node.expression;

    if (
      !isAssignmentExpression(assignment) ||
      !isMemberExpression(assignment.left) ||
      assignment.left.computed ||
      !isIdentifier(assignment.left.object, { name: componentName }) ||
      !isIdentifier(assignment.left.property) ||
      !isObjectExpression(assignment.right)
    ) {
      continue;
    }

    const target =
      assignment.left.property.name === 'contextTypes'
        ? 'context'
        : assignment.left.property.name === 'childContextTypes'
          ? 'childContext'
          : null;

    if (!target) {
      continue;
    }

    for (const property of assignment.right.properties) {
      if (!isProperty(property) || !isIdentifier(property.key)) {
        continue;
      }

      const propType = getPropType(property.value);

      if (propType) {
        documentation[target] ??= {};
        documentation[target][property.key.name] = propType;
      }
    }
  }
};

export default contextHandler;
