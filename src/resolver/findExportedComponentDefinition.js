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

import isExportsOrModuleAssignment from '../utils/isExportsOrModuleAssignment';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import isReactComponentClass from '../utils/isReactComponentClass';
import isReactCreateClassCall from '../utils/isReactCreateClassCall';
import isStatelessComponent from '../utils/isStatelessComponent';
import normalizeClassDefinition from '../utils/normalizeClassDefinition';
import resolveExportDeclaration from '../utils/resolveExportDeclaration';
import resolveToValue from '../utils/resolveToValue';
import resolveHOC from '../utils/resolveHOC';

const ERROR_MULTIPLE_DEFINITIONS =
  'Multiple exported component definitions found.';

function ignore() {
  return false;
}

function isComponentDefinition(path) {
  return (
    isReactCreateClassCall(path) ||
    isReactComponentClass(path) ||
    isStatelessComponent(path) ||
    isReactForwardRefCall(path)
  );
}

function resolveDefinition(definition, types) {
  if (isReactCreateClassCall(definition)) {
    // return argument
    const resolvedPath = resolveToValue(definition.get('arguments', 0));
    if (types.ObjectExpression.check(resolvedPath.node)) {
      return resolvedPath;
    }
  } else if (isReactComponentClass(definition)) {
    normalizeClassDefinition(definition);
    return definition;
  } else if (isStatelessComponent(definition)) {
    return definition;
  } else if (isReactForwardRefCall(definition)) {
    return definition;
  }
  return null;
}

/**
 * Given an AST, this function tries to find the exported component definition.
 *
 * The component definition is either the ObjectExpression passed to
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
export default function findExportedComponentDefinition(
  ast: ASTNode,
  recast: Object,
): ?NodePath {
  const types = recast.types.namedTypes;
  let foundDefinition;

  function exportDeclaration(path) {
    const definitions = resolveExportDeclaration(path, types).reduce(
      (acc, definition) => {
        if (isComponentDefinition(definition)) {
          acc.push(definition);
        } else {
          const resolved = resolveToValue(resolveHOC(definition));
          if (isComponentDefinition(resolved)) {
            acc.push(resolved);
          }
        }
        return acc;
      },
      [],
    );

    if (definitions.length === 0) {
      return false;
    }
    if (definitions.length > 1 || foundDefinition) {
      // If a file exports multiple components, ... complain!
      throw new Error(ERROR_MULTIPLE_DEFINITIONS);
    }
    foundDefinition = resolveDefinition(definitions[0], types);
    return false;
  }

  recast.visit(ast, {
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

    visitAssignmentExpression: function(path) {
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
      if (foundDefinition) {
        // If a file exports multiple components, ... complain!
        throw new Error(ERROR_MULTIPLE_DEFINITIONS);
      }
      foundDefinition = resolveDefinition(path, types);
      return false;
    },
  });

  return foundDefinition;
}
