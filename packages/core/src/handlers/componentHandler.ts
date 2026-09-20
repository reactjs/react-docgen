import {
  isClassDeclaration,
  isClassExpression,
  isCallExpression,
  isArrowFunctionExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isLiteral,
  type Handler,
} from '../internal.js';
import getComponentDescription from '../utils/getComponentDescription.js';
import getComponentName from '../utils/getComponentName.js';
import getExplicitDisplayName from '../utils/getExplicitDisplayName.js';
import getClassStaticValue from '../utils/getClassStaticValue.js';

const componentHandler: Handler = (documentation, path, file) => {
  if (
    !isFunctionDeclaration(path.node) &&
    !isClassDeclaration(path.node) &&
    !isClassExpression(path.node) &&
    !isFunctionExpression(path.node) &&
    !isArrowFunctionExpression(path.node) &&
    !isCallExpression(path.node)
  ) {
    return;
  }

  const componentName = getComponentName(path);

  if (componentName) {
    const staticDisplayName = getClassStaticValue(file, path, 'displayName');
    const explicitDisplayName =
      staticDisplayName &&
      isLiteral(staticDisplayName) &&
      (typeof staticDisplayName.value === 'string' ||
        typeof staticDisplayName.value === 'number')
        ? staticDisplayName.value
        : getExplicitDisplayName(file, componentName);

    if (explicitDisplayName !== null) {
      documentation.displayName = explicitDisplayName ?? componentName;
    }
  }
  documentation.description = getComponentDescription(file, path);
};

export default componentHandler;
