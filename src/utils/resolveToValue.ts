import { namedTypes as t } from 'ast-types';
import getMemberExpressionRoot from './getMemberExpressionRoot';
import getPropertyValuePath from './getPropertyValuePath';
import { Array as toArray } from './expressionTo';
import { traverseShallow } from './traverse';
import getMemberValuePath, {
  isSupportedDefinitionType,
} from './getMemberValuePath';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';
import { Scope } from 'ast-types/lib/scope';
import { Context } from 'ast-types/lib/path-visitor';

function findScopePath(
  paths: NodePath[],
  path: NodePath,
  importer: Importer,
): NodePath | null {
  if (paths.length < 1) {
    return null;
  }
  let resultPath = paths[0];
  const parentPath = resultPath.parent;

  // Namespace imports are handled separately, at the site of a member expression access
  if (
    t.ImportDefaultSpecifier.check(parentPath.node) ||
    t.ImportSpecifier.check(parentPath.node)
  ) {
    let exportName;
    if (t.ImportDefaultSpecifier.check(parentPath.node)) {
      exportName = 'default';
    } else {
      exportName = parentPath.node.imported.name;
    }

    const resolvedPath = importer(parentPath.parentPath, exportName);

    if (resolvedPath) {
      return resolveToValue(resolvedPath, importer);
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
  }

  if (resultPath.node !== path.node) {
    return resolveToValue(resultPath, importer);
  }

  return null;
}

/**
 * Tries to find the last value assigned to `name` in the scope created by
 * `scope`. We are not descending into any statements (blocks).
 */
function findLastAssignedValue(
  scope: Scope,
  idPath: NodePath<t.Identifier>,
  importer: Importer,
): NodePath | null {
  const results: NodePath[] = [];
  const name = idPath.node.name;

  traverseShallow(scope.path, {
    visitAssignmentExpression: function (
      this: Context,
      path: NodePath<t.AssignmentExpression>,
    ): boolean | undefined {
      const node = path.node;
      // Skip anything that is not an assignment to a variable with the
      // passed name.
      // Ensure the LHS isn't the reference we're trying to resolve.
      if (
        !t.Identifier.check(node.left) ||
        node.left === idPath.node ||
        node.left.name !== name ||
        node.operator !== '='
      ) {
        return this.traverse(path);
      }
      // Ensure the RHS doesn't contain the reference we're trying to resolve.
      const candidatePath = path.get('right');
      for (let p = idPath; p && p.node != null; p = p.parent) {
        if (p.node === candidatePath.node) {
          return this.traverse(path);
        }
      }
      results.push(candidatePath);
      return false;
    },
  });

  const resultPath = results.pop();

  if (resultPath == null) {
    return null;
  }
  return resolveToValue(resultPath, importer);
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
  importer: Importer,
): NodePath {
  const node = path.node;
  if (t.VariableDeclarator.check(node)) {
    if (node.init) {
      return resolveToValue(path.get('init'), importer);
    }
  } else if (t.MemberExpression.check(node)) {
    const root = getMemberExpressionRoot(path);
    const resolved = resolveToValue(root, importer);
    if (t.ObjectExpression.check(resolved.node)) {
      let propertyPath: NodePath | null = resolved;
      for (const propertyName of toArray(path, importer).slice(1)) {
        if (propertyPath && t.ObjectExpression.check(propertyPath.node)) {
          propertyPath = getPropertyValuePath(
            propertyPath,
            propertyName,
            importer,
          );
        }
        if (!propertyPath) {
          return path;
        }
        propertyPath = resolveToValue(propertyPath, importer);
      }
      return propertyPath;
    } else if (isSupportedDefinitionType(resolved)) {
      const memberPath = getMemberValuePath(
        resolved,
        path.node.property.name,
        importer,
      );
      if (memberPath) {
        return resolveToValue(memberPath, importer);
      }
    } else if (
      t.ImportDeclaration.check(resolved.node) &&
      resolved.node.specifiers
    ) {
      // Handle references to namespace imports, e.g. import * as foo from 'bar'.
      // Try to find a specifier that matches the root of the member expression, and
      // find the export that matches the property name.
      for (const specifier of resolved.node.specifiers) {
        if (
          t.ImportNamespaceSpecifier.check(specifier) &&
          specifier.local &&
          specifier.local.name === root.node.name
        ) {
          const resolvedPath = importer(
            resolved,
            root.parentPath.node.property.name,
          );
          if (resolvedPath) {
            return resolveToValue(resolvedPath, importer);
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
      return resolveToValue(path.get('right'), importer);
    }
  } else if (
    t.TypeCastExpression.check(node) ||
    t.TSAsExpression.check(node) ||
    t.TSTypeAssertion.check(node)
  ) {
    return resolveToValue(path.get('expression'), importer);
  } else if (t.Identifier.check(node)) {
    if (
      (t.ClassDeclaration.check(path.parentPath.node) ||
        t.ClassExpression.check(path.parentPath.node) ||
        t.Function.check(path.parentPath.node)) &&
      path.parentPath.get('id') === path
    ) {
      return path.parentPath;
    }

    let scope: Scope = path.scope.lookup(node.name);
    let resolvedPath: NodePath | null = null;
    if (scope) {
      // The variable may be assigned a different value after initialization.
      // We are first trying to find all assignments to the variable in the
      // block where it is defined (i.e. we are not traversing into statements)
      resolvedPath = findLastAssignedValue(scope, path, importer);
      if (!resolvedPath) {
        const bindings = scope.getBindings()[node.name];
        resolvedPath = findScopePath(bindings, path, importer);
      }
    } else {
      scope = path.scope.lookupType(node.name);
      if (scope) {
        const typesInScope = scope.getTypes()[node.name];
        resolvedPath = findScopePath(typesInScope, path, importer);
      }
    }
    return resolvedPath || path;
  }

  return path;
}
