import getMemberValuePath from '../utils/getMemberValuePath';
import getNameOrValue from '../utils/getNameOrValue';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import resolveToValue from '../utils/resolveToValue';
import resolveFunctionDefinitionToReturnValue from '../utils/resolveFunctionDefinitionToReturnValue';
import type Documentation from '../Documentation';
import type { NodePath } from '@babel/traverse';
import type { Identifier } from '@babel/types';

export default function displayNameHandler(
  documentation: Documentation,
  path: NodePath,
): void {
  let displayNamePath: NodePath | null = getMemberValuePath(
    path,
    'displayName',
  );
  if (!displayNamePath) {
    // Function and class declarations need special treatment. The name of the
    // function / class is the displayName
    if (
      (path.isClassDeclaration() || path.isFunctionDeclaration()) &&
      path.has('id')
    ) {
      documentation.set(
        'displayName',
        getNameOrValue(path.get('id') as NodePath<Identifier>),
      );
    } else if (
      path.isArrowFunctionExpression() ||
      path.isFunctionExpression() ||
      isReactForwardRefCall(path)
    ) {
      let currentPath = path;
      while (currentPath.parentPath) {
        if (currentPath.parentPath.isVariableDeclarator()) {
          documentation.set(
            'displayName',
            getNameOrValue(currentPath.parentPath.get('id')),
          );
          return;
        } else if (currentPath.parentPath.isAssignmentExpression()) {
          const leftPath = currentPath.parentPath.get('left');
          if (leftPath.isIdentifier() || leftPath.isLiteral()) {
            documentation.set('displayName', getNameOrValue(leftPath));
            return;
          }
        }
        currentPath = currentPath.parentPath;
      }
    }
    return;
  }
  displayNamePath = resolveToValue(displayNamePath);

  // If display name is defined as a getter we get a function expression as
  // value. In that case we try to determine the value from the return
  // statement.
  if (
    displayNamePath.isFunctionExpression() ||
    displayNamePath.isClassMethod() ||
    displayNamePath.isObjectMethod() // TODO test objectmethod? Do we need it?
  ) {
    displayNamePath = resolveFunctionDefinitionToReturnValue(displayNamePath);
  }
  if (
    !displayNamePath ||
    (!displayNamePath.isStringLiteral() && !displayNamePath.isNumericLiteral())
  ) {
    return;
  }
  documentation.set('displayName', displayNamePath.node.value);
}
