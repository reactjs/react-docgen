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
import type { FileNodeWithOptions, Parser } from '../babelParser';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

const ERROR_MULTIPLE_DEFINITIONS =
  'Multiple exported component definitions found.';

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
): NodePath | null {
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
  ast: FileNodeWithOptions,
  _parser: Parser,
  importer: Importer,
): NodePath | null {
  let foundDefinition: NodePath | null = null;

  function exportDeclaration(path: NodePath): false {
    const definitions = resolveExportDeclaration(path, importer).reduce(
      (acc: NodePath[], definition: NodePath) => {
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
    foundDefinition = resolveDefinition(definitions[0], importer);
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
    visitWhileStatement: ignore,
    visitDoWhileStatement: ignore,
    visitForStatement: ignore,
    visitForInStatement: ignore,
    visitForOfStatement: ignore,
    visitImportDeclaration: ignore,

    visitExportNamedDeclaration: exportDeclaration,
    visitExportDefaultDeclaration: exportDeclaration,

    visitAssignmentExpression: function (
      path: NodePath<t.AssignmentExpression>,
    ): false {
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
      if (foundDefinition) {
        // If a file exports multiple components, ... complain!
        throw new Error(ERROR_MULTIPLE_DEFINITIONS);
      }
      foundDefinition = resolveDefinition(path, importer);
      return false;
    },
  });

  return foundDefinition;
}
