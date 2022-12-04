import isExportsOrModuleAssignment from '../utils/isExportsOrModuleAssignment.js';
import resolveExportDeclaration from '../utils/resolveExportDeclaration.js';
import resolveToValue from '../utils/resolveToValue.js';
import resolveHOC from '../utils/resolveHOC.js';
import type { NodePath } from '@babel/traverse';
import { visitors } from '@babel/traverse';
import { shallowIgnoreVisitors } from '../utils/traverse.js';
import type {
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
} from '@babel/types';
import type { ComponentNode, Resolver } from './index.js';
import type FileState from '../FileState.js';
import resolveComponentDefinition, {
  isComponentDefinition,
} from '../utils/resolveComponentDefinition.js';
import { ERROR_CODES, ReactDocgenError } from '../error.js';

interface TraverseState {
  foundDefinition: NodePath<ComponentNode> | null;
}

function exportDeclaration(
  path: NodePath<ExportDefaultDeclaration | ExportNamedDeclaration>,
  state: TraverseState,
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
  if (definitions.length > 1 || state.foundDefinition) {
    // If a file exports multiple components, ... complain!
    throw new ReactDocgenError(ERROR_CODES.MULTIPLE_DEFINITIONS);
  }
  const definition = resolveComponentDefinition(definitions[0]);

  if (definition) {
    state.foundDefinition = definition;
  }

  return path.skip();
}

const explodedVisitors = visitors.explode<TraverseState>({
  ...shallowIgnoreVisitors,

  ExportNamedDeclaration: { enter: exportDeclaration },
  ExportDefaultDeclaration: { enter: exportDeclaration },

  AssignmentExpression: {
    enter: function (path, state): void {
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
      if (state.foundDefinition) {
        // If a file exports multiple components, ... complain!
        throw new ReactDocgenError(ERROR_CODES.MULTIPLE_DEFINITIONS);
      }
      const definition = resolveComponentDefinition(resolvedPath);

      if (definition) {
        state.foundDefinition = definition;
      }

      return path.skip();
    },
  },
});

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
  const state: TraverseState = {
    foundDefinition: null,
  };

  file.traverse(explodedVisitors, state);

  if (state.foundDefinition) {
    return [state.foundDefinition];
  }

  return [];
};

export default findExportedComponentDefinition;
