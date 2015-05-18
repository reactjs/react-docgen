/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * @flow
 */
"use strict";

var isExportsOrModuleAssignment =
  require('../utils/isExportsOrModuleAssignment');
var isReactCreateClassCall = require('../utils/isReactCreateClassCall');
var resolveToValue = require('../utils/resolveToValue');

var ERROR_MULTIPLE_DEFINITIONS =
  'Multiple exported component definitions found.';

function ignore() {
  return false;
}

function resolveExportDeclaration(
  path: NodePath,
  types: Object
): Array<NodePath> {
  var definitions = [];
  if (path.node.default) {
    definitions.push(path.get('declaration'));
  } else if (path.node.declaration) {
    if (types.VariableDeclaration.check(path.node.declaration)) {
      path.get('declaration', 'declarations').each(
        declarator => definitions.push(declarator)
      );
    } else {
      definitions.push(path.get('declaration'));
    }
  } else if (path.node.specifiers) {
    path.get('specifiers').each(
      specifier => definitions.push(specifier.get('id'))
    );
  }
  return definitions
    .map(definition => resolveToValue(definition))
    .filter(path => path && isReactCreateClassCall(path))
    .map(path => resolveToValue(path.get('arguments', 0)))
    .filter(path => types.ObjectExpression.check(path.node));
}

/**
 * Given an AST, this function tries to find the object expression that is
 * passed to `React.createClass`, by resolving all references properly.
 */
function findExportedReactCreateClass(
  ast: ASTNode,
  recast: Object
): ?NodePath {
  var types = recast.types.namedTypes;
  var definition;

  recast.visit(ast, {
    visitFunctionDeclaration: ignore,
    visitFunctionExpression: ignore,
    visitIfStatement: ignore,
    visitWithStatement: ignore,
    visitSwitchStatement: ignore,
    visitCatchCause: ignore,
    visitWhileStatement: ignore,
    visitDoWhileStatement: ignore,
    visitForStatement: ignore,
    visitForInStatement: ignore,
    visitExportDeclaration: function(path) {
      var definitions = resolveExportDeclaration(path, types);
      if (definitions.length === 0) {
        return false;
      }
      if (definitions.length > 1 || definition) {
        // If a file exports multiple components, ... complain!
        throw new Error(ERROR_MULTIPLE_DEFINITIONS);
      }
      definition = definitions[0];
      return false;
    },
    visitAssignmentExpression: function(path) {
      // Ignore anything that is not `exports.X = ...;` or
      // `module.exports = ...;`
      if (!isExportsOrModuleAssignment(path)) {
        return false;
      }
      // Resolve the value of the right hand side. It should resolve to a call
      // expression, something like React.createClass
      path = resolveToValue(path.get('right'));
      if (!isReactCreateClassCall(path)) {
        return false;
      }
      if (definition) {
        // If a file exports multiple components, ... complain!
        throw new Error(ERROR_MULTIPLE_DEFINITIONS);
      }
      // We found React.createClass. Lets get cracking!
      var resolvedPath = resolveToValue(path.get('arguments', 0));
      if (types.ObjectExpression.check(resolvedPath.node)) {
        definition = resolvedPath;
      }
      return false;
    }
  });

  return definition;
}

module.exports = findExportedReactCreateClass;
