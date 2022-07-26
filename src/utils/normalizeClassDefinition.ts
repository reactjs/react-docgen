import { classProperty } from '@babel/types';
import getMemberExpressionRoot from '../utils/getMemberExpressionRoot';
import getMembers from '../utils/getMembers';
import type { NodePath } from '@babel/traverse';
import type {
  ClassDeclaration,
  ClassExpression,
  Expression,
} from '@babel/types';

const ignore = (path: NodePath) => path.skip();

/**
 * Given a class definition (i.e. `class` declaration or expression), this
 * function "normalizes" the definition, by looking for assignments of static
 * properties and converting them to ClassProperties.
 *
 * Example:
 *
 * class MyComponent extends React.Component {
 *   // ...
 * }
 * MyComponent.propTypes = { ... };
 *
 * is converted to
 *
 * class MyComponent extends React.Component {
 *   // ...
 *   static propTypes = { ... };
 * }
 */
export default function normalizeClassDefinition(
  classDefinition: NodePath<ClassDeclaration | ClassExpression>,
): void {
  let variableName;

  if (classDefinition.isClassDeclaration()) {
    // Class declarations may not have an id, e.g.: `export default class extends React.Component {}`
    if (classDefinition.node.id) {
      variableName = classDefinition.node.id.name;
    }
  } else if (classDefinition.isClassExpression()) {
    let parentPath: NodePath | null = classDefinition.parentPath;

    while (
      parentPath &&
      parentPath.node !== classDefinition.scope.block &&
      !parentPath.isBlockStatement()
    ) {
      if (parentPath.isVariableDeclarator()) {
        const idPath = parentPath.get('id');

        if (idPath.isIdentifier()) {
          variableName = idPath.node.name;
          break;
        }
      } else if (parentPath.isAssignmentExpression()) {
        const leftPath = parentPath.get('left');

        if (leftPath.isIdentifier()) {
          variableName = leftPath.node.name;
          break;
        }
      }
      parentPath = parentPath.parentPath;
    }
  }

  if (!variableName) {
    return;
  }

  const scopeBlock = classDefinition.parentPath.scope.block;

  classDefinition.parentPath.scope.traverse(scopeBlock, {
    Function: ignore,
    ClassDeclaration: ignore,
    ClassExpression: ignore,
    ForInStatement: ignore,
    ForStatement: ignore,
    AssignmentExpression(path) {
      const left = path.get('left');

      if (left.isMemberExpression()) {
        const first = getMemberExpressionRoot(left);

        if (first.isIdentifier() && first.node.name === variableName) {
          const [member] = getMembers(left);

          if (
            member &&
            !member.path.has('computed') &&
            !member.path.isPrivateName()
          ) {
            const property = classProperty(
              member.path.node as Expression,
              path.node.right,
              null,
              null,
              false,
              true,
            );

            classDefinition.get('body').unshiftContainer('body', property);
            path.skip();
            path.remove();
          }
        }
      } else {
        path.skip();
      }
    },
  });
}
