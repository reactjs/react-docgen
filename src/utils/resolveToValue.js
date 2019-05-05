/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import types from 'ast-types';
import getMemberExpressionRoot from './getMemberExpressionRoot';
import getPropertyValuePath from './getPropertyValuePath';
import { Array as toArray } from './expressionTo';
import { traverseShallow } from './traverse';
import resolveImportedValue from './resolveImportedValue';
import getMemberValuePath, {
  isSupportedDefinitionType,
} from './getMemberValuePath';

const { namedTypes: t, NodePath, builders } = types;

function buildMemberExpressionFromPattern(path: NodePath): ?NodePath {
  const node = path.node;
  if (t.Property.check(node)) {
    const objPath = buildMemberExpressionFromPattern(path.parent);
    if (objPath) {
      return new NodePath(
        builders.memberExpression(
          objPath.node,
          node.key,
          t.Literal.check(node.key),
        ),
        objPath,
      );
    }
  } else if (t.ObjectPattern.check(node)) {
    return buildMemberExpressionFromPattern(path.parent);
  } else if (t.VariableDeclarator.check(node)) {
    return path.get('init');
  }
  return null;
}

function findScopePath(
  paths: Array<NodePath>,
  path: NodePath,
  resolveImports: boolean,
): ?NodePath {
  if (paths.length < 1) {
    return null;
  }
  let resultPath = paths[0];
  const parentPath = resultPath.parent;

  // Namespace imports are handled separately, at the site of a member expression access
  if (
    resolveImports &&
    (t.ImportDefaultSpecifier.check(parentPath.node) ||
      t.ImportSpecifier.check(parentPath.node))
  ) {
    let exportName;
    if (t.ImportDefaultSpecifier.check(parentPath.node)) {
      exportName = 'default';
    } else {
      exportName = parentPath.node.imported.name;
    }

    const resolvedPath = resolveImportedValue(
      parentPath.parentPath,
      exportName,
    );

    if (resolvedPath) {
      return resolveToValue(resolvedPath, resolveImports);
    }
  }

  if (
    t.ImportDefaultSpecifier.check(parentPath.node) ||
    t.ImportSpecifier.check(parentPath.node) ||
    t.ImportNamespaceSpecifier.check(parentPath.node) ||
    t.VariableDeclarator.check(parentPath.node) ||
    t.TypeAlias.check(parentPath.node) ||
    t.InterfaceDeclaration.check(parentPath.node) ||
    t.TSTypeAliasDeclaration.check(parentPath.node) ||
    t.TSInterfaceDeclaration.check(parentPath.node)
  ) {
    resultPath = parentPath;
  } else if (t.Property.check(parentPath.node)) {
    // must be inside a pattern
    const memberExpressionPath = buildMemberExpressionFromPattern(parentPath);
    if (memberExpressionPath) {
      return memberExpressionPath;
    }
  }

  if (resultPath.node !== path.node) {
    return resolveToValue(resultPath, resolveImports);
  }

  return null;
}

/**
 * Tries to find the last value assigned to `name` in the scope created by
 * `scope`. We are not descending into any statements (blocks).
 */
function findLastAssignedValue(scope, name, resolveImports) {
  const results = [];

  traverseShallow(scope.path.node, {
    visitAssignmentExpression: function(path) {
      const node = path.node;
      // Skip anything that is not an assignment to a variable with the
      // passed name.
      if (
        !t.Identifier.check(node.left) ||
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
  return resolveToValue(results.pop(), resolveImports);
}

/**
 * If the path is an identifier, it is resolved in the scope chain.
 * If it is an assignment expression, it resolves to the right hand side.
 * If it is a member expression it is resolved to it's initialization value.
 *
 * Else the path itself is returned.
 */
export default function resolveToValue(
  path: NodePath,
  resolveImports: boolean = true,
): NodePath {
  const node = path.node;
  if (t.VariableDeclarator.check(node)) {
    if (node.init) {
      return resolveToValue(path.get('init'), resolveImports);
    }
  } else if (t.MemberExpression.check(node)) {
    const root = getMemberExpressionRoot(path);
    const resolved = resolveToValue(root, resolveImports);
    if (t.ObjectExpression.check(resolved.node)) {
      let propertyPath = resolved;
      for (const propertyName of toArray(path).slice(1)) {
        if (propertyPath && t.ObjectExpression.check(propertyPath.node)) {
          propertyPath = getPropertyValuePath(propertyPath, propertyName);
        }
        if (!propertyPath) {
          return path;
        }
        propertyPath = resolveToValue(propertyPath, resolveImports);
      }
      return propertyPath;
    } else if (isSupportedDefinitionType(resolved)) {
      const memberPath = getMemberValuePath(resolved, path.node.property.name);
      if (memberPath) {
        return resolveToValue(memberPath, resolveImports);
      }
    } else if (t.ImportDeclaration.check(resolved.node)) {
      // Handle references to namespace imports, e.g. import * as foo from 'bar'.
      // Try to find a specifier that matches the root of the member expression, and
      // find the export that matches the property name.
      for (const specifier of resolved.node.specifiers) {
        if (
          t.ImportNamespaceSpecifier.check(specifier) &&
          specifier.local.name === root.node.name
        ) {
          const resolvedPath = resolveImportedValue(
            resolved,
            root.parentPath.node.property.name,
          );
          if (resolvedPath) {
            return resolveToValue(resolvedPath, resolveImports);
          }
        }
      }
    }
  } else if (
    t.ImportDefaultSpecifier.check(node) ||
    t.ImportNamespaceSpecifier.check(node) ||
    t.ImportSpecifier.check(node)
  ) {
    // go up two levels as first level is only the array of specifiers
    return path.parentPath.parentPath;
  } else if (t.AssignmentExpression.check(node)) {
    if (node.operator === '=') {
      return resolveToValue(path.get('right'), resolveImports);
    }
  } else if (t.TypeCastExpression.check(node)) {
    return resolveToValue(path.get('expression'), resolveImports);
  } else if (t.Identifier.check(node)) {
    if (
      (t.ClassDeclaration.check(path.parentPath.node) ||
        t.ClassExpression.check(path.parentPath.node) ||
        t.Function.check(path.parentPath.node)) &&
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
      resolvedPath = findLastAssignedValue(scope, node.name, resolveImports);
      if (!resolvedPath) {
        const bindings = scope.getBindings()[node.name];
        resolvedPath = findScopePath(bindings, path, resolveImports);
      }
    } else {
      scope = path.scope.lookupType(node.name);
      if (scope) {
        const typesInScope = scope.getTypes()[node.name];
        resolvedPath = findScopePath(typesInScope, path, resolveImports);
      }
    }
    return resolvedPath || path;
  }

  return path;
}
