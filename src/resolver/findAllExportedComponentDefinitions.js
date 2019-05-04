/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import types from 'ast-types';
import isExportsOrModuleAssignment from '../utils/isExportsOrModuleAssignment';
import isReactComponentClass from '../utils/isReactComponentClass';
import isReactCreateClassCall from '../utils/isReactCreateClassCall';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import isStatelessComponent from '../utils/isStatelessComponent';
import normalizeClassDefinition from '../utils/normalizeClassDefinition';
import resolveExportDeclaration from '../utils/resolveExportDeclaration';
import resolveToValue from '../utils/resolveToValue';
import resolveHOC from '../utils/resolveHOC';

const { visit, namedTypes: t } = types;

function ignore(): false {
  return false;
}

function isComponentDefinition(path: NodePath): boolean {
  return (
    isReactCreateClassCall(path) ||
    isReactComponentClass(path) ||
    isStatelessComponent(path) ||
    isReactForwardRefCall(path)
  );
}

function resolveDefinition(definition: NodePath): ?NodePath {
  if (isReactCreateClassCall(definition)) {
    // return argument
    const resolvedPath = resolveToValue(definition.get('arguments', 0));
    if (t.ObjectExpression.check(resolvedPath.node)) {
      return resolvedPath;
    }
  } else if (isReactComponentClass(definition)) {
    normalizeClassDefinition(definition);
    return definition;
  } else if (
    isStatelessComponent(definition) ||
    isReactForwardRefCall(definition)
  ) {
    return definition;
  }
  return null;
}

/**
 * Given an AST, this function tries to find the exported component definitions.
 *
 * The component definitions are either the ObjectExpression passed to
 * `React.createClass` or a `class` definition extending `React.Component` or
 * having a `render()` method.
 *
 * If a definition is part of the following statements, it is considered to be
 * exported:
 *
 * modules.exports = Definition;
 * exports.foo = Definition;
 * export default Definition;
 * export var Definition = ...;
 */
export default function findExportedComponentDefinitions(
  ast: ASTNode,
): Array<NodePath> {
  const components: Array<NodePath> = [];

  function exportDeclaration(path: NodePath): ?boolean {
    const definitions: Array<?NodePath> = resolveExportDeclaration(path)
      .reduce((acc, definition) => {
        if (isComponentDefinition(definition)) {
          acc.push(definition);
        } else {
          const resolved = resolveToValue(resolveHOC(definition));
          if (isComponentDefinition(resolved)) {
            acc.push(resolved);
          }
        }
        return acc;
      }, [])
      .map(definition => resolveDefinition(definition));

    if (definitions.length === 0) {
      return false;
    }
    definitions.forEach(definition => {
      if (definition && components.indexOf(definition) === -1) {
        components.push(definition);
      }
    });
    return false;
  }

  visit(ast, {
    visitFunctionDeclaration: ignore,
    visitFunctionExpression: ignore,
    visitClassDeclaration: ignore,
    visitClassExpression: ignore,
    visitIfStatement: ignore,
    visitWithStatement: ignore,
    visitSwitchStatement: ignore,
    visitCatchCause: ignore,
    visitWhileStatement: ignore,
    visitDoWhileStatement: ignore,
    visitForStatement: ignore,
    visitForInStatement: ignore,

    visitExportDeclaration: exportDeclaration,
    visitExportNamedDeclaration: exportDeclaration,
    visitExportDefaultDeclaration: exportDeclaration,

    visitAssignmentExpression: function(path: NodePath): ?boolean {
      // Ignore anything that is not `exports.X = ...;` or
      // `module.exports = ...;`
      if (!isExportsOrModuleAssignment(path)) {
        return false;
      }
      // Resolve the value of the right hand side. It should resolve to a call
      // expression, something like React.createClass
      path = resolveToValue(path.get('right'));
      if (!isComponentDefinition(path)) {
        path = resolveToValue(resolveHOC(path));
        if (!isComponentDefinition(path)) {
          return false;
        }
      }
      const definition = resolveDefinition(path);
      if (definition && components.indexOf(definition) === -1) {
        components.push(definition);
      }
      return false;
    },
  });

  return components;
}
