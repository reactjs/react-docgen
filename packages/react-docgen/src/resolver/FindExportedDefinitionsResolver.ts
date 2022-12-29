import isExportsOrModuleAssignment from '../utils/isExportsOrModuleAssignment.js';
import resolveExportDeclaration from '../utils/resolveExportDeclaration.js';
import resolveToValue from '../utils/resolveToValue.js';
import resolveHOC from '../utils/resolveHOC.js';
import type { NodePath } from '@babel/traverse';
import { visitors } from '@babel/traverse';
import { shallowIgnoreVisitors } from '../utils/traverse.js';
import type {
  AssignmentExpression,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
} from '@babel/types';
import type FileState from '../FileState.js';
import type { ComponentNodePath, ResolverClass } from './index.js';
import resolveComponentDefinition, {
  isComponentDefinition,
} from '../utils/resolveComponentDefinition.js';
import { ERROR_CODES, ReactDocgenError } from '../error.js';

interface TraverseState {
  foundDefinitions: Set<ComponentNodePath>;
  limit: number;
}

function exportDeclaration(
  path: NodePath<ExportDefaultDeclaration | ExportNamedDeclaration>,
  state: TraverseState,
): void {
  resolveExportDeclaration(path).forEach(definition => {
    if (!isComponentDefinition(definition)) {
      definition = resolveToValue(resolveHOC(definition));

      if (!isComponentDefinition(definition)) {
        return;
      }
    }

    if (state.limit > 0 && state.foundDefinitions.size > 0) {
      // If a file exports multiple components, ... complain!
      throw new ReactDocgenError(ERROR_CODES.MULTIPLE_DEFINITIONS);
    }

    const resolved = resolveComponentDefinition(definition);

    if (resolved) {
      state.foundDefinitions.add(resolved);
    }
  });

  return path.skip();
}

function assignmentExpressionVisitor(
  path: NodePath<AssignmentExpression>,
  state: TraverseState,
): void {
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
  if (state.limit > 0 && state.foundDefinitions.size > 0) {
    // If a file exports multiple components, ... complain!
    throw new ReactDocgenError(ERROR_CODES.MULTIPLE_DEFINITIONS);
  }

  const definition = resolveComponentDefinition(resolvedPath);

  if (definition) {
    state.foundDefinitions.add(definition);
  }

  return path.skip();
}

const explodedVisitors = visitors.explode<TraverseState>({
  ...shallowIgnoreVisitors,

  ExportNamedDeclaration: { enter: exportDeclaration },
  ExportDefaultDeclaration: { enter: exportDeclaration },
  AssignmentExpression: { enter: assignmentExpressionVisitor },
});

interface FindExportedDefinitionsResolverOptions {
  limit?: number;
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
 *
 * limit can be used to limit the components to be found. When the limit is reached an error will be thrown
 */
export default class FindExportedDefinitionsResolver implements ResolverClass {
  limit: number;

  constructor({ limit = 0 }: FindExportedDefinitionsResolverOptions = {}) {
    this.limit = limit;
  }

  resolve(file: FileState): ComponentNodePath[] {
    const state: TraverseState = {
      foundDefinitions: new Set<ComponentNodePath>(),
      limit: this.limit,
    };

    file.traverse(explodedVisitors, state);

    return Array.from(state.foundDefinitions);
  }
}
