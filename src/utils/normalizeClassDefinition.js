/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import getMemberExpressionRoot from '../utils/getMemberExpressionRoot';
import getMembers from '../utils/getMembers';
import recast from 'recast';

var {types: {namedTypes: types, builders}} = recast;
var ignore = () => false;

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
  classDefinition: NodePath
): void {
  var variableName;
  if (types.ClassDeclaration.check(classDefinition.node)) {
    variableName = classDefinition.node.id.name;
  } else if (types.ClassExpression.check(classDefinition.node)) {
    var {parentPath} = classDefinition;
    while (parentPath.node !== classDefinition.scope.node &&
        !types.BlockStatement.check(parentPath.node)) {
      if (types.VariableDeclarator.check(parentPath.node) &&
        types.Identifier.check(parentPath.node.id)) {
        variableName = parentPath.node.id.name;
        break;
      } else if (types.AssignmentExpression.check(parentPath.node) &&
        types.Identifier.check(parentPath.node.left)) {
        variableName = parentPath.node.left.name;
        break;
      }
      parentPath = parentPath.parentPath;
    }
  }

  if (!variableName) {
    return;
  }

  var scopeRoot = classDefinition.scope;
  recast.visit(scopeRoot.node, {
    visitFunction: ignore,
    visitClassDeclaration: ignore,
    visitClassExpression: ignore,
    visitForInStatement: ignore,
    visitForStatement: ignore,
    visitAssignmentExpression: function(path) {
      if (types.MemberExpression.check(path.node.left)) {
        var first = getMemberExpressionRoot(path.get('left'));
        if (types.Identifier.check(first.node) &&
          first.node.name === variableName) {
          var [member] = getMembers(path.get('left'));
          if (member && !member.path.node.computed) {
            var classProperty = builders.classProperty(
              member.path.node,
              path.node.right,
              null,
              true
            );
            classDefinition.get('body', 'body').value.push(classProperty);
            return false;
          }
        }
        this.traverse(path);
      } else {
        return false;
      }
    },
  });
}
