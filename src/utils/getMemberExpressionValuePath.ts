import type { NodePath } from '@babel/traverse';
import type { Expression } from '@babel/types';
import getNameOrValue from './getNameOrValue';
import { String as toString } from './expressionTo';
import isReactForwardRefCall from './isReactForwardRefCall';

function resolveName(path: NodePath): string | undefined {
  if (path.isVariableDeclaration()) {
    const declarations = path.get('declarations');
    if (declarations.length > 1) {
      throw new TypeError(
        'Got unsupported VariableDeclaration. VariableDeclaration must only ' +
          'have a single VariableDeclarator. Got ' +
          declarations.length +
          ' declarations.',
      );
    }
    const id = declarations[0].get('id');
    if (id.isIdentifier()) {
      return id.node.name;
    }

    return;
  }

  if (path.isFunctionDeclaration()) {
    const id = path.get('id');
    if (id.isIdentifier()) {
      return id.node.name;
    }

    return;
  }

  if (
    path.isFunctionExpression() ||
    path.isArrowFunctionExpression() ||
    path.isTaggedTemplateExpression() ||
    path.isCallExpression() ||
    isReactForwardRefCall(path)
  ) {
    let currentPath: NodePath = path;
    while (currentPath.parentPath) {
      if (currentPath.parentPath.isVariableDeclarator()) {
        const id = currentPath.parentPath.get('id');
        if (id.isIdentifier()) {
          return id.node.name;
        }
        return;
      }

      currentPath = currentPath.parentPath;
    }

    return;
  }

  throw new TypeError(
    'Attempted to resolveName for an unsupported path. resolveName does not accept ' +
      path.node.type +
      '".',
  );
}

export default function getMemberExpressionValuePath(
  variableDefinition: NodePath,
  memberName: string,
): NodePath<Expression> | null {
  const localName = resolveName(variableDefinition);
  const program = variableDefinition.findParent(path => path.isProgram());

  if (!localName || !program) {
    // likely an immediately exported and therefore nameless/anonymous node
    // passed in
    return null;
  }

  let result: NodePath<Expression> | null = null;
  program.traverse({
    AssignmentExpression(path) {
      const memberPath = path.get('left');
      if (!memberPath.isMemberExpression()) {
        return;
      }
      const property = memberPath.get('property');

      if (
        (!memberPath.node.computed || property.isLiteral()) &&
        getNameOrValue(property) === memberName &&
        toString(memberPath.get('object')) === localName
      ) {
        result = path.get('right');
        path.skip();
        return;
      }
    },
  });

  return result;
}
