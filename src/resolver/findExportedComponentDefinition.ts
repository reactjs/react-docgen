import isExportsOrModuleAssignment from '../utils/isExportsOrModuleAssignment';
import resolveExportDeclaration from '../utils/resolveExportDeclaration';
import resolveToValue from '../utils/resolveToValue';
import resolveHOC from '../utils/resolveHOC';
import type { NodePath } from '@babel/traverse';
import { shallowIgnoreVisitors } from '../utils/traverse';
import type {
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
} from '@babel/types';
import type { ComponentNode, Resolver } from '.';
import type FileState from '../FileState';
import resolveComponentDefinition, {
  isComponentDefinition,
} from '../utils/resolveComponentDefinition';

const ERROR_MULTIPLE_DEFINITIONS =
  'Multiple exported component definitions found.';

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
const findExportedComponentDefinition: Resolver = function (
  file: FileState,
): Array<NodePath<ComponentNode>> {
  const foundDefinition: Array<NodePath<ComponentNode>> = [];

  function exportDeclaration(
    path: NodePath<ExportDefaultDeclaration | ExportNamedDeclaration>,
  ): void {
    const definitions = resolveExportDeclaration(path).reduce(
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
      [] as Array<NodePath<ComponentNode>>,
    );

    if (definitions.length === 0) {
      return path.skip();
    }
    if (definitions.length > 1 || foundDefinition.length === 1) {
      // If a file exports multiple components, ... complain!
      throw new Error(ERROR_MULTIPLE_DEFINITIONS);
    }
    const definition = resolveComponentDefinition(definitions[0]);
    if (definition) {
      foundDefinition.push(definition);
    }
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
      if (foundDefinition.length === 1) {
        // If a file exports multiple components, ... complain!
        throw new Error(ERROR_MULTIPLE_DEFINITIONS);
      }
      const definition = resolveComponentDefinition(resolvedPath);
      if (definition) {
        foundDefinition.push(definition);
      }
      return path.skip();
    },
  });

  return foundDefinition;
};

export default findExportedComponentDefinition;
