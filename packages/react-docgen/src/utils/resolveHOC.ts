import type { NodePath } from '@babel/traverse';
import isReactCreateClassCall from './isReactCreateClassCall.js';
import isReactForwardRefCall from './isReactForwardRefCall.js';
import resolveToValue from './resolveToValue.js';

/**
 * If the path is a call expression, it recursively resolves to the
 * rightmost argument, stopping if it finds a React.createClass call expression
 *
 * Else the path itself is returned.
 */
export default function resolveHOC(path: NodePath): NodePath {
  if (
    path.isCallExpression() &&
    !isReactCreateClassCall(path) &&
    !isReactForwardRefCall(path)
  ) {
    const args = path.get('arguments');
    const [firstArg] = args;

    if (!firstArg) {
      return path;
    }

    // If the first argument is one of these types then the component might be the last argument
    // If there are all identifiers then we cannot figure out exactly and have to assume it is the first
    if (
      args.length > 1 &&
      (firstArg.isLiteral() ||
        firstArg.isObjectExpression() ||
        firstArg.isArrayExpression() ||
        firstArg.isSpreadElement())
    ) {
      const lastArg = args[args.length - 1];

      if (lastArg) {
        return resolveHOC(resolveToValue(lastArg));
      }
    }

    return resolveHOC(resolveToValue(firstArg));
  }

  return path;
}
