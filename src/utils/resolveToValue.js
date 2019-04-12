/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import recast from 'recast';
import getMemberExpressionRoot from './getMemberExpressionRoot';
import getPropertyValuePath from './getPropertyValuePath';
import { Array as toArray } from './expressionTo';
import { traverseShallow } from './traverse';

const {
  types: { NodePath, builders, namedTypes: types },
} = recast;

function buildMemberExpressionFromPattern(path: NodePath): ?NodePath {
  const node = path.node;
  if (types.Property.check(node)) {
    const objPath = buildMemberExpressionFromPattern(path.parent);
    if (objPath) {
      return new NodePath(
        builders.memberExpression(
          objPath.node,
          node.key,
          types.Literal.check(node.key),
        ),
        objPath,
      );
    }
  } else if (types.ObjectPattern.check(node)) {
    return buildMemberExpressionFromPattern(path.parent);
  } else if (types.VariableDeclarator.check(node)) {
    return path.get('init');
  }
  return null;
}

function findScopePath(paths: Array<NodePath>, path: NodePath): ?NodePath {
  if (paths.length < 1) {
    return null;
  }
  let resultPath = paths[0];
  const parentPath = resultPath.parent;

  if (
    types.ImportDefaultSpecifier.check(parentPath.node) ||
    types.ImportSpecifier.check(parentPath.node) ||
    types.ImportNamespaceSpecifier.check(parentPath.node) ||
    types.VariableDeclarator.check(parentPath.node) ||
    types.TypeAlias.check(parentPath.node)
  ) {
    resultPath = parentPath;
  } else if (types.Property.check(parentPath.node)) {
    // must be inside a pattern
    const memberExpressionPath = buildMemberExpressionFromPattern(parentPath);
    if (memberExpressionPath) {
      return memberExpressionPath;
    }
  }

  if (resultPath.node !== path.node) {
    return resolveToValue(resultPath);
  }

  return null;
}

/**
 * Tries to find the last value assigned to `name` in the scope created by
 * `scope`. We are not descending into any statements (blocks).
 */
function findLastAssignedValue(scope, name) {
  const results = [];

  traverseShallow(scope.path.node, {
    visitAssignmentExpression: function(path) {
      const node = path.node;
      // Skip anything that is not an assignment to a variable with the
      // passed name.
      if (
        !types.Identifier.check(node.left) ||
        node.left.name !== name ||
        node.operator !== '='
      ) {
        return this.traverse(path);
      }
      results.push(path.get('right'));
      return false;
    },
  });

  if (results.length === 0) {
    return null;
  }
  return resolveToValue(results.pop());
}

/**
 * If the path is an identifier, it is resolved in the scope chain.
 * If it is an assignment expression, it resolves to the right hand side.
 * If it is a member expression it is resolved to it's initialization value.
 *
 * Else the path itself is returned.
 */
export default function resolveToValue(path: NodePath): NodePath {
  const node = path.node;
  if (types.VariableDeclarator.check(node)) {
    if (node.init) {
      return resolveToValue(path.get('init'));
    }
  } else if (types.MemberExpression.check(node)) {
    const resolved = resolveToValue(getMemberExpressionRoot(path));
    if (types.ObjectExpression.check(resolved.node)) {
      let propertyPath = resolved;
      for (const propertyName of toArray(path).slice(1)) {
        if (propertyPath && types.ObjectExpression.check(propertyPath.node)) {
          propertyPath = getPropertyValuePath(propertyPath, propertyName);
        }
        if (!propertyPath) {
          return path;
        }
        propertyPath = resolveToValue(propertyPath);
      }
      return propertyPath;
    }
  } else if (
    types.ImportDefaultSpecifier.check(node) ||
    types.ImportNamespaceSpecifier.check(node) ||
    types.ImportSpecifier.check(node)
  ) {
    // go up two levels as first level is only the array of specifiers
    return path.parentPath.parentPath;
  } else if (types.AssignmentExpression.check(node)) {
    if (node.operator === '=') {
      return resolveToValue(path.get('right'));
    }
  } else if (types.TypeCastExpression.check(node)) {
    return resolveToValue(path.get('expression'));
  } else if (types.Identifier.check(node)) {
    if (
      (types.ClassDeclaration.check(path.parentPath.node) ||
        types.ClassExpression.check(path.parentPath.node) ||
        types.Function.check(path.parentPath.node)) &&
      path.parentPath.get('id') === path
    ) {
      return path.parentPath;
    }

    let scope = path.scope.lookup(node.name);
    let resolvedPath: ?NodePath;
    if (scope) {
      // The variable may be assigned a different value after initialization.
      // We are first trying to find all assignments to the variable in the
      // block where it is defined (i.e. we are not traversing into statements)
      resolvedPath = findLastAssignedValue(scope, node.name);
      if (!resolvedPath) {
        const bindings = scope.getBindings()[node.name];
        resolvedPath = findScopePath(bindings, path);
      }
    } else {
      scope = path.scope.lookupType(node.name);
      if (scope) {
        const typesInScope = scope.getTypes()[node.name];
        resolvedPath = findScopePath(typesInScope, path);
      }
    }
    return resolvedPath || path;
  }

  return path;
}
