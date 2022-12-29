import isReactComponentClass from '../utils/isReactComponentClass.js';
import isReactCreateClassCall from '../utils/isReactCreateClassCall.js';
import isReactForwardRefCall from '../utils/isReactForwardRefCall.js';
import isStatelessComponent from '../utils/isStatelessComponent.js';
import normalizeClassDefinition from '../utils/normalizeClassDefinition.js';
import resolveToValue from '../utils/resolveToValue.js';
import type { NodePath } from '@babel/traverse';
import { visitors } from '@babel/traverse';
import type FileState from '../FileState.js';
import type { ComponentNodePath, ResolverClass } from './index.js';
import type {
  ArrowFunctionExpression,
  FunctionDeclaration,
  FunctionExpression,
  ObjectMethod,
} from '@babel/types';

interface TraverseState {
  foundDefinitions: Set<ComponentNodePath>;
}

function classVisitor(path: NodePath, state: TraverseState) {
  if (isReactComponentClass(path)) {
    normalizeClassDefinition(path);
    state.foundDefinitions.add(path);
  }

  path.skip();
}

function statelessVisitor(
  path: NodePath<
    | ArrowFunctionExpression
    | FunctionDeclaration
    | FunctionExpression
    | ObjectMethod
  >,
  state: TraverseState,
) {
  if (isStatelessComponent(path)) {
    state.foundDefinitions.add(path);
  }

  path.skip();
}

const explodedVisitors = visitors.explode<TraverseState>({
  FunctionDeclaration: { enter: statelessVisitor },
  FunctionExpression: { enter: statelessVisitor },
  ObjectMethod: { enter: statelessVisitor },
  ArrowFunctionExpression: { enter: statelessVisitor },
  ClassExpression: { enter: classVisitor },
  ClassDeclaration: { enter: classVisitor },
  CallExpression: {
    enter: function (path, state): void {
      if (isReactForwardRefCall(path)) {
        // If the the inner function was previously identified as a component
        // replace it with the parent node
        const inner = resolveToValue(
          path.get('arguments')[0],
        ) as ComponentNodePath;

        state.foundDefinitions.delete(inner);
        state.foundDefinitions.add(path);

        // Do not traverse into arguments
        return path.skip();
      } else if (isReactCreateClassCall(path)) {
        const resolvedPath = resolveToValue(path.get('arguments')[0]);

        if (resolvedPath.isObjectExpression()) {
          state.foundDefinitions.add(resolvedPath);
        }

        // Do not traverse into arguments
        return path.skip();
      }
    },
  },
});

/**
 * Given an AST, this function tries to find all object expressions that are
 * passed to `React.createClass` calls, by resolving all references properly.
 */
export default class FindAllDefinitionsResolver implements ResolverClass {
  resolve(file: FileState): ComponentNodePath[] {
    const state: TraverseState = {
      foundDefinitions: new Set<ComponentNodePath>(),
    };

    file.traverse(explodedVisitors, state);

    return Array.from(state.foundDefinitions);
  }
}
