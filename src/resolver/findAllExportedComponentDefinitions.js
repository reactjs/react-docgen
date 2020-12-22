/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t, visit } from 'ast-types';
import isExportsOrModuleAssignment from '../utils/isExportsOrModuleAssignment';
import isReactComponentClass from '../utils/isReactComponentClass';
import isReactCreateClassCall from '../utils/isReactCreateClassCall';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import isStatelessComponent from '../utils/isStatelessComponent';
import normalizeClassDefinition from '../utils/normalizeClassDefinition';
import resolveExportDeclaration from '../utils/resolveExportDeclaration';
import resolveToValue from '../utils/resolveToValue';
import resolveHOC from '../utils/resolveHOC';
import type { Parser } from '../babelParser';
import type { Importer } from '../types';

function ignore(): false {
  return false;
}

function isComponentDefinition(path: NodePath, importer: Importer): boolean {
  return (
    isReactCreateClassCall(path, importer) ||
    isReactComponentClass(path, importer) ||
    isStatelessComponent(path, importer) ||
    isReactForwardRefCall(path, importer)
  );
}

function resolveDefinition(
  definition: NodePath,
  importer: Importer,
): ?NodePath {
  if (isReactCreateClassCall(definition, importer)) {
    // return argument
    const resolvedPath = resolveToValue(
      definition.get('arguments', 0),
      importer,
    );
    if (t.ObjectExpression.check(resolvedPath.node)) {
      return resolvedPath;
    }
  } else if (isReactComponentClass(definition, importer)) {
    normalizeClassDefinition(definition);
    return definition;
  } else if (
    isStatelessComponent(definition, importer) ||
    isReactForwardRefCall(definition, importer)
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
  parser: Parser,
  importer: Importer,
): Array<NodePath> {
  const components: Array<NodePath> = [];

  function exportDeclaration(path: NodePath): ?boolean {
    const definitions: Array<?NodePath> = resolveExportDeclaration(
      path,
      importer,
    )
      .reduce((acc, definition) => {
        if (isComponentDefinition(definition, importer)) {
          acc.push(definition);
        } else {
          const resolved = resolveToValue(
            resolveHOC(definition, importer),
            importer,
          );
          if (isComponentDefinition(resolved, importer)) {
            acc.push(resolved);
          }
        }
        return acc;
      }, [])
      .map(definition => resolveDefinition(definition, importer));

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

    visitAssignmentExpression: function (path: NodePath): ?boolean {
      // Ignore anything that is not `exports.X = ...;` or
      // `module.exports = ...;`
      if (!isExportsOrModuleAssignment(path, importer)) {
        return false;
      }
      // Resolve the value of the right hand side. It should resolve to a call
      // expression, something like React.createClass
      path = resolveToValue(path.get('right'), importer);
      if (!isComponentDefinition(path, importer)) {
        path = resolveToValue(resolveHOC(path, importer), importer);
        if (!isComponentDefinition(path, importer)) {
          return false;
        }
      }
      const definition = resolveDefinition(path, importer);
      if (definition && components.indexOf(definition) === -1) {
        components.push(definition);
      }
      return false;
    },
  });

  return components;
}
