import getPropertyValuePath from './getPropertyValuePath';
import isReactCreateElementCall from './isReactCreateElementCall';
import isReactCloneElementCall from './isReactCloneElementCall';
import isReactChildrenElementCall from './isReactChildrenElementCall';
import resolveToValue from './resolveToValue';
import type { NodePath } from '@babel/traverse';
import type { Expression } from '@babel/types';

const validPossibleStatelessComponentTypes = [
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
  'ObjectMethod',
];

function isJSXElementOrReactCall(path: NodePath): boolean {
  return (
    path.isJSXElement() ||
    path.isJSXFragment() ||
    (path.isCallExpression() &&
      (isReactCreateElementCall(path) ||
        isReactCloneElementCall(path) ||
        isReactChildrenElementCall(path)))
  );
}

function resolvesToJSXElementOrReactCall(
  path: NodePath,
  seen: WeakSet<NodePath>,
): boolean {
  // avoid returns with recursive function calls
  if (seen.has(path)) {
    return false;
  }

  seen.add(path);

  // Is the path is already a JSX element or a call to one of the React.* functions
  if (isJSXElementOrReactCall(path)) {
    return true;
  }

  const resolvedPath = resolveToValue(path);

  // If the path points to a conditional expression, then we need to look only at
  // the two possible paths
  if (resolvedPath.isConditionalExpression()) {
    return (
      resolvesToJSXElementOrReactCall(
        resolvedPath.get('consequent'),

        seen,
      ) ||
      resolvesToJSXElementOrReactCall(
        resolvedPath.get('alternate'),

        seen,
      )
    );
  }

  // If the path points to a logical expression (AND, OR, ...), then we need to look only at
  // the two possible paths
  if (resolvedPath.isLogicalExpression()) {
    return (
      resolvesToJSXElementOrReactCall(
        resolvedPath.get('left'),

        seen,
      ) || resolvesToJSXElementOrReactCall(resolvedPath.get('right'), seen)
    );
  }

  // Is the resolved path is already a JSX element or a call to one of the React.* functions
  // Only do this if the resolvedPath actually resolved something as otherwise we did this check already
  if (resolvedPath !== path && isJSXElementOrReactCall(resolvedPath)) {
    return true;
  }

  // If we have a call expression, lets try to follow it
  if (resolvedPath.isCallExpression()) {
    let calleeValue = resolveToValue(resolvedPath.get('callee'));

    if (returnsJSXElementOrReactCall(calleeValue, seen)) {
      return true;
    }

    if (calleeValue.isMemberExpression()) {
      let resolvedValue: NodePath | undefined;
      const namesToResolve: NodePath[] = [];

      const calleeObj = calleeValue.get('object');
      if (calleeObj.isIdentifier()) {
        namesToResolve.push(calleeValue.get('property'));
        resolvedValue = resolveToValue(calleeObj);
      } else {
        do {
          namesToResolve.unshift(calleeValue.get('property'));
          calleeValue = calleeValue.get('object');
        } while (calleeValue.isMemberExpression());

        resolvedValue = resolveToValue(calleeValue);
      }

      if (resolvedValue && resolvedValue.isObjectExpression()) {
        const resolvedMemberExpression = namesToResolve.reduce(
          (result: NodePath | null, nodePath) => {
            if (result) {
              if (
                (!nodePath.isIdentifier() && !nodePath.isStringLiteral()) ||
                !result.isObjectExpression()
              ) {
                return null;
              }
              result = getPropertyValuePath(
                result,
                nodePath.isIdentifier()
                  ? nodePath.node.name
                  : nodePath.node.value,
              );
              if (result && result.isIdentifier()) {
                return resolveToValue(result);
              }
            }
            return result;
          },
          resolvedValue,
        );

        if (
          !resolvedMemberExpression ||
          returnsJSXElementOrReactCall(resolvedMemberExpression, seen)
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

function returnsJSXElementOrReactCall(
  path: NodePath,
  seen: WeakSet<NodePath> = new WeakSet(),
): boolean {
  let visited = false;

  if (path.isObjectProperty()) {
    path = path.get('value');
  }

  if (!path.isFunction()) {
    return false;
  }

  // early exit for ArrowFunctionExpressions
  if (
    path.isArrowFunctionExpression() &&
    !path.get('body').isBlockStatement() &&
    resolvesToJSXElementOrReactCall(path.get('body'), seen)
  ) {
    return true;
  }

  const scope = path.scope;

  path.traverse({
    ReturnStatement(returnPath) {
      // Only check return statements which are part of the checked function scope
      if (returnPath.scope.getFunctionParent() !== scope) {
        path.skip();
        return;
      }

      if (
        returnPath.node.argument &&
        resolvesToJSXElementOrReactCall(
          returnPath.get('argument') as NodePath<Expression>,

          seen,
        )
      ) {
        visited = true;
        path.skip();
      }
    },
  });

  return visited;
}

/**
 * Returns `true` if the path represents a function which returns a JSXElement
 */
export default function isStatelessComponent(path: NodePath): boolean {
  if (!path.inType(...validPossibleStatelessComponentTypes)) {
    return false;
  }

  return returnsJSXElementOrReactCall(path);
}
