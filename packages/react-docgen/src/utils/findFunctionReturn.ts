import type { NodePath } from '@babel/traverse';
import { visitors } from '@babel/traverse';
import resolveToValue from './resolveToValue.js';
import { ignore } from './traverse.js';

type Predicate = (p: NodePath) => boolean;
interface TraverseState {
  readonly predicate: Predicate;
  resolvedReturnPath?: NodePath;
  readonly seen: WeakSet<NodePath>;
}

const explodedVisitors = visitors.explode<TraverseState>({
  Function: { enter: ignore },
  Class: { enter: ignore },
  ObjectExpression: { enter: ignore },
  ReturnStatement: {
    enter: function (path, state) {
      const argument = path.get('argument');

      if (argument.hasNode()) {
        const resolvedPath = resolvesToFinalValue(
          argument,
          state.predicate,
          state.seen,
        );

        if (resolvedPath) {
          state.resolvedReturnPath = resolvedPath;
          path.stop();
        }
      }
    },
  },
});

function resolvesToFinalValue(
  path: NodePath,
  predicate: Predicate,
  seen: WeakSet<NodePath>,
): NodePath | undefined {
  // avoid returns with recursive function calls
  if (seen.has(path)) {
    return;
  }
  seen.add(path);

  // Is the path already passes then return it.
  if (predicate(path)) {
    return path;
  }

  const resolvedPath = resolveToValue(path);

  // If the resolved path is already passing then no need to further check
  // Only do this if the resolvedPath actually resolved something as otherwise we did this check already
  if (resolvedPath.node !== path.node && predicate(resolvedPath)) {
    return resolvedPath;
  }

  // If the path points to a conditional expression, then we need to look only at
  // the two possible paths
  if (resolvedPath.isConditionalExpression()) {
    return (
      resolvesToFinalValue(resolvedPath.get('consequent'), predicate, seen) ||
      resolvesToFinalValue(resolvedPath.get('alternate'), predicate, seen)
    );
  }

  // If the path points to a logical expression (AND, OR, ...), then we need to look only at
  // the two possible paths
  if (resolvedPath.isLogicalExpression()) {
    return (
      resolvesToFinalValue(resolvedPath.get('left'), predicate, seen) ||
      resolvesToFinalValue(resolvedPath.get('right'), predicate, seen)
    );
  }

  // If we have a call expression, lets try to follow it
  if (resolvedPath.isCallExpression()) {
    const returnValue = findFunctionReturnWithCache(
      resolveToValue(resolvedPath.get('callee')),
      predicate,
      seen,
    );

    if (returnValue) {
      return returnValue;
    }
  }

  return;
}

/**
 * This can be used in two ways
 * 1. Find the first return path that passes the predicate function
 *    (for example to check if a function is returning something)
 * 2. Find all occurrences of return values
 *    For this the predicate acts more like a collector and always needs to return false
 */
function findFunctionReturnWithCache(
  path: NodePath,
  predicate: Predicate,
  seen: WeakSet<NodePath>,
): NodePath | undefined {
  let functionPath: NodePath = path;

  if (functionPath.isObjectProperty()) {
    functionPath = functionPath.get('value');
  } else if (functionPath.isClassProperty()) {
    const classPropertyValue = functionPath.get('value');

    if (classPropertyValue.hasNode()) {
      functionPath = classPropertyValue;
    }
  }

  if (!functionPath.isFunction()) {
    return;
  }

  // skip traversing for ArrowFunctionExpressions with no block
  if (path.isArrowFunctionExpression()) {
    const body = path.get('body');

    if (!body.isBlockStatement()) {
      return resolvesToFinalValue(body, predicate, seen);
    }
  }

  const state: TraverseState = {
    predicate,
    seen,
  };

  path.traverse(explodedVisitors, state);

  return state.resolvedReturnPath;
}

/**
 * This can be used in two ways
 * 1. Find the first return path that passes the predicate function
 *    (for example to check if a function is returning something)
 * 2. Find all occurrences of return values
 *    For this the predicate acts more like a collector and always needs to return false
 */
export default function findFunctionReturn(
  path: NodePath,
  predicate: Predicate,
): NodePath | undefined {
  return findFunctionReturnWithCache(path, predicate, new WeakSet());
}
