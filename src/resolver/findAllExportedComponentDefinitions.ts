import isExportsOrModuleAssignment from '../utils/isExportsOrModuleAssignment';
import isReactComponentClass from '../utils/isReactComponentClass';
import isReactCreateClassCall from '../utils/isReactCreateClassCall';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import isStatelessComponent from '../utils/isStatelessComponent';
import normalizeClassDefinition from '../utils/normalizeClassDefinition';
import resolveExportDeclaration from '../utils/resolveExportDeclaration';
import resolveToValue from '../utils/resolveToValue';
import resolveHOC from '../utils/resolveHOC';
import type { NodePath } from '@babel/traverse';
import { shallowIgnoreVisitors } from '../utils/traverse';
import type {
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
} from '@babel/types';
import type FileState from '../FileState';
import type { Resolver } from '.';

function isComponentDefinition(path: NodePath): boolean {
  return (
    isReactCreateClassCall(path) ||
    isReactComponentClass(path) ||
    isStatelessComponent(path) ||
    isReactForwardRefCall(path)
  );
}

// TODO duplicate code
function resolveDefinition(definition: NodePath): NodePath | null {
  if (isReactCreateClassCall(definition)) {
    // return argument
    const resolvedPath = resolveToValue(definition.get('arguments')[0]);
    if (resolvedPath.isObjectExpression()) {
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
const findExportedComponentDefinitions: Resolver = function (
  file: FileState,
): NodePath[] {
  const components: NodePath[] = [];

  function exportDeclaration(
    path: NodePath<ExportDefaultDeclaration | ExportNamedDeclaration>,
  ): void {
    const definitions = resolveExportDeclaration(path)
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
      }, [] as NodePath[])
      .map(definition => resolveDefinition(definition));

    if (definitions.length === 0) {
      return path.skip();
    }
    definitions.forEach(definition => {
      if (definition && components.indexOf(definition) === -1) {
        components.push(definition);
      }
    });
    return path.skip();
  }

  file.traverse({
    ...shallowIgnoreVisitors,

    ExportNamedDeclaration: exportDeclaration,
    ExportDefaultDeclaration: exportDeclaration,

    AssignmentExpression: function (path): void {
      // Ignore anything that is not `exports.X = ...;` or
      // `module.exports = ...;`
      if (!isExportsOrModuleAssignment(path)) {
        return path.skip();
      }
      // Resolve the value of the right hand side. It should resolve to a call
      // expression, something like React.createClass
      let resolvedPath = resolveToValue(path.get('right'));
      if (!isComponentDefinition(resolvedPath)) {
        resolvedPath = resolveToValue(resolveHOC(resolvedPath));
        if (!isComponentDefinition(resolvedPath)) {
          return path.skip();
        }
      }
      const definition = resolveDefinition(resolvedPath);
      if (definition && components.indexOf(definition) === -1) {
        components.push(definition);
      }
      return path.skip();
    },
  });

  return components;
};

export default findExportedComponentDefinitions;
