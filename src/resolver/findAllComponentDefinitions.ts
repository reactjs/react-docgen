import isReactComponentClass from '../utils/isReactComponentClass';
import isReactCreateClassCall from '../utils/isReactCreateClassCall';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import isStatelessComponent from '../utils/isStatelessComponent';
import normalizeClassDefinition from '../utils/normalizeClassDefinition';
import resolveToValue from '../utils/resolveToValue';
import type { NodePath } from '@babel/traverse';
import type FileState from '../FileState';
import type { ComponentNode, Resolver } from '.';

/**
 * Given an AST, this function tries to find all object expressions that are
 * passed to `React.createClass` calls, by resolving all references properly.
 */
const findAllComponentDefinitions: Resolver = function (
  file: FileState,
): Array<NodePath<ComponentNode>> {
  const definitions = new Set<NodePath<ComponentNode>>();

  function classVisitor(path) {
    if (isReactComponentClass(path)) {
      normalizeClassDefinition(path);
      definitions.add(path);
    }
    return false;
  }

  function statelessVisitor(path) {
    if (isStatelessComponent(path)) {
      definitions.add(path);
    }
    return false;
  }

  file.traverse({
    FunctionDeclaration: statelessVisitor,
    FunctionExpression: statelessVisitor,
    ObjectMethod: statelessVisitor,
    ArrowFunctionExpression: statelessVisitor,
    ClassExpression: classVisitor,
    ClassDeclaration: classVisitor,
    CallExpression: function (path): void {
      if (isReactForwardRefCall(path)) {
        // If the the inner function was previously identified as a component
        // replace it with the parent node
        const inner = resolveToValue(
          path.get('arguments')[0],
        ) as NodePath<ComponentNode>;
        definitions.delete(inner);
        definitions.add(path);

        // Do not traverse into arguments
        return path.skip();
      } else if (isReactCreateClassCall(path)) {
        const resolvedPath = resolveToValue(path.get('arguments')[0]);
        if (resolvedPath.isObjectExpression()) {
          definitions.add(resolvedPath);
        }

        // Do not traverse into arguments
        return path.skip();
      }
    },
  });

  return Array.from(definitions);
};

export default findAllComponentDefinitions;
