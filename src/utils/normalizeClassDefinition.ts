import { builders, namedTypes as t, visit } from 'ast-types';
import type { NodePath } from 'ast-types/lib/node-path';
import getMemberExpressionRoot from '../utils/getMemberExpressionRoot';
import getMembers from '../utils/getMembers';

const ignore = () => false;

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
  classDefinition: NodePath,
): void {
  let variableName;
  if (t.ClassDeclaration.check(classDefinition.node)) {
    // Class declarations don't have an id, e.g.: `export default class extends React.Component {}`
    if (classDefinition.node.id) {
      variableName = classDefinition.node.id.name;
    }
  } else if (t.ClassExpression.check(classDefinition.node)) {
    let { parentPath } = classDefinition;
    while (
      parentPath.node !== classDefinition.scope.node &&
      !t.BlockStatement.check(parentPath.node)
    ) {
      if (
        t.VariableDeclarator.check(parentPath.node) &&
        t.Identifier.check(parentPath.node.id)
      ) {
        variableName = parentPath.node.id.name;
        break;
      } else if (
        t.AssignmentExpression.check(parentPath.node) &&
        t.Identifier.check(parentPath.node.left)
      ) {
        variableName = parentPath.node.left.name;
        break;
      }
      parentPath = parentPath.parentPath;
    }
  }

  if (!variableName) {
    return;
  }

  const scopeRoot = classDefinition.scope;
  visit(scopeRoot.node, {
    visitFunction: ignore,
    visitClassDeclaration: ignore,
    visitClassExpression: ignore,
    visitForInStatement: ignore,
    visitForStatement: ignore,
    visitAssignmentExpression: function (path) {
      if (t.MemberExpression.check(path.node.left)) {
        const first = getMemberExpressionRoot(path.get('left'));
        if (
          t.Identifier.check(first.node) &&
          first.node.name === variableName
        ) {
          const [member] = getMembers(path.get('left'));
          if (member && !member.path.node.computed) {
            const classProperty = builders.classProperty(
              member.path.node,
              path.node.right,
              null,
              true,
            );
            classDefinition.get('body', 'body').value.push(classProperty);
            return false;
          }
        }
        this.traverse(path);
      } else {
        return false;
      }

      return undefined;
    },
  });
}
