import {
  isArrowFunctionExpression,
  isAssignmentExpression,
  isExpressionStatement,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isMemberExpression,
  isObjectPattern,
  type Handler,
} from '../internal.js';
import getBody from '../utils/getBody.js';
import getComponentName from '../utils/getComponentName.js';
import getDefaultValue from '../utils/getDefaultValue.js';
import getParameterDefaults from '../utils/getParameterDefaults.js';
import getObjectProperties from '../utils/getObjectProperties.js';
import getPropertyName from '../utils/getPropertyName.js';
import getClassStaticValue from '../utils/getClassStaticValue.js';
import unwrapExpression from '../utils/unwrapExpression.js';

const defaultPropsHandler: Handler = (documentation, path, file) => {
  const componentName = getComponentName(path);

  if (
    isFunctionDeclaration(path.node) ||
    isFunctionExpression(path.node) ||
    isArrowFunctionExpression(path.node)
  ) {
    const [parameter] = path.node.params;

    if (parameter && isObjectPattern(parameter)) {
      for (const [name, value] of getParameterDefaults(parameter)) {
        const prop = documentation.props?.[name];

        if (prop) {
          prop.defaultValue = getDefaultValue(file, value);
          prop.required = false;
        } else {
          documentation.props ??= {};
          documentation.props[name] = {
            defaultValue: getDefaultValue(file, value),
            required: false,
          };
        }
      }
    }
  }

  if (!componentName) {
    return;
  }

  const staticDefaults = getClassStaticValue(file, path, 'defaultProps');
  const defaultObjects = staticDefaults ? [staticDefaults] : [];

  for (const statement of getBody(file)) {
    if (!isExpressionStatement(statement.node)) {
      continue;
    }

    const assignment = statement.node.expression;

    if (
      !isAssignmentExpression(assignment) ||
      !isMemberExpression(assignment.left) ||
      assignment.left.computed ||
      !isIdentifier(unwrapExpression(assignment.left.object), {
        name: componentName,
      }) ||
      !isIdentifier(assignment.left.property, { name: 'defaultProps' })
    ) {
      continue;
    }

    defaultObjects.push(assignment.right);
  }

  for (const defaultsObject of defaultObjects) {
    for (const property of getObjectProperties(file, defaultsObject)) {
      const keyName = getPropertyName(property.key);
      const propertyName =
        keyName && property.computed && isIdentifier(property.key)
          ? `@computed#${keyName}`
          : keyName;

      if (!propertyName) continue;

      const prop = documentation.props?.[propertyName];

      if (prop) {
        prop.defaultValue = getDefaultValue(file, property.value);
        prop.required = false;
      } else {
        documentation.props ??= {};
        documentation.props[propertyName] = {
          defaultValue: getDefaultValue(file, property.value),
          required: false,
        };
      }
    }
  }
};

export default defaultPropsHandler;
