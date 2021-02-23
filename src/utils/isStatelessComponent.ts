import { namedTypes as t, visit } from 'ast-types';
import getPropertyValuePath from './getPropertyValuePath';
import isReactComponentClass from './isReactComponentClass';
import isReactCreateClassCall from './isReactCreateClassCall';
import isReactCreateElementCall from './isReactCreateElementCall';
import isReactCloneElementCall from './isReactCloneElementCall';
import isReactChildrenElementCall from './isReactChildrenElementCall';
import resolveToValue from './resolveToValue';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

const validPossibleStatelessComponentTypes = [
  'Property',
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
];

function isJSXElementOrReactCall(path: NodePath, importer: Importer): boolean {
  return (
    path.node.type === 'JSXElement' ||
    path.node.type === 'JSXFragment' ||
    (path.node.type === 'CallExpression' &&
      isReactCreateElementCall(path, importer)) ||
    (path.node.type === 'CallExpression' &&
      isReactCloneElementCall(path, importer)) ||
    (path.node.type === 'CallExpression' &&
      isReactChildrenElementCall(path, importer))
  );
}

function resolvesToJSXElementOrReactCall(
  path: NodePath,
  importer: Importer,
  seen: WeakSet<NodePath>,
): boolean {
  // avoid returns with recursive function calls
  if (seen.has(path)) {
    return false;
  }

  seen.add(path);

  // Is the path is already a JSX element or a call to one of the React.* functions
  if (isJSXElementOrReactCall(path, importer)) {
    return true;
  }

  const resolvedPath = resolveToValue(path, importer);

  // If the path points to a conditional expression, then we need to look only at
  // the two possible paths
  if (resolvedPath.node.type === 'ConditionalExpression') {
    return (
      resolvesToJSXElementOrReactCall(
        resolvedPath.get('consequent'),
        importer,
        seen,
      ) ||
      resolvesToJSXElementOrReactCall(
        resolvedPath.get('alternate'),
        importer,
        seen,
      )
    );
  }

  // If the path points to a logical expression (AND, OR, ...), then we need to look only at
  // the two possible paths
  if (resolvedPath.node.type === 'LogicalExpression') {
    return (
      resolvesToJSXElementOrReactCall(
        resolvedPath.get('left'),
        importer,
        seen,
      ) ||
      resolvesToJSXElementOrReactCall(resolvedPath.get('right'), importer, seen)
    );
  }

  // Is the resolved path is already a JSX element or a call to one of the React.* functions
  // Only do this if the resolvedPath actually resolved something as otherwise we did this check already
  if (
    resolvedPath !== path &&
    isJSXElementOrReactCall(resolvedPath, importer)
  ) {
    return true;
  }

  // If we have a call expression, lets try to follow it
  if (resolvedPath.node.type === 'CallExpression') {
    let calleeValue = resolveToValue(resolvedPath.get('callee'), importer);

    if (returnsJSXElementOrReactCall(calleeValue, importer, seen)) {
      return true;
    }

    let resolvedValue;

    const namesToResolve = [calleeValue.get('property')];

    if (calleeValue.node.type === 'MemberExpression') {
      if (calleeValue.get('object').node.type === 'Identifier') {
        resolvedValue = resolveToValue(calleeValue.get('object'), importer);
      } else if (t.MemberExpression.check(calleeValue.node)) {
        do {
          calleeValue = calleeValue.get('object');
          namesToResolve.unshift(calleeValue.get('property'));
        } while (t.MemberExpression.check(calleeValue.node));

        resolvedValue = resolveToValue(calleeValue.get('object'), importer);
      }
    }

    if (resolvedValue && t.ObjectExpression.check(resolvedValue.node)) {
      const resolvedMemberExpression = namesToResolve.reduce(
        (result, nodePath) => {
          if (!nodePath) {
            return result;
          }

          if (result) {
            result = getPropertyValuePath(result, nodePath.node.name, importer);
            if (result && t.Identifier.check(result.node)) {
              return resolveToValue(result, importer);
            }
          }
          return result;
        },
        resolvedValue,
      );

      if (
        !resolvedMemberExpression ||
        returnsJSXElementOrReactCall(resolvedMemberExpression, importer, seen)
      ) {
        return true;
      }
    }
  }

  return false;
}

function returnsJSXElementOrReactCall(
  path: NodePath,
  importer: Importer,
  seen: WeakSet<NodePath> = new WeakSet(),
): boolean {
  let visited = false;

  // early exit for ArrowFunctionExpressions
  if (
    path.node.type === 'ArrowFunctionExpression' &&
    path.get('body').node.type !== 'BlockStatement' &&
    resolvesToJSXElementOrReactCall(path.get('body'), importer, seen)
  ) {
    return true;
  }

  let scope = path.scope;
  // If we get a property we want the function scope it holds and not its outer scope
  if (path.node.type === 'Property') {
    scope = path.get('value').scope;
  }

  // @ts-ignore
  visit(path, {
    visitReturnStatement(returnPath): boolean | null | undefined {
      // Only check return statements which are part of the checked function scope
      if (returnPath.scope !== scope) return false;

      if (
        resolvesToJSXElementOrReactCall(
          returnPath.get('argument'),
          importer,
          seen,
        )
      ) {
        visited = true;
        return false;
      }

      this.traverse(returnPath);

      return;
    },
  });

  return visited;
}

/**
 * Returns `true` if the path represents a function which returns a JSXElement
 */
export default function isStatelessComponent(
  path: NodePath,
  importer: Importer,
): boolean {
  const node = path.node;

  if (validPossibleStatelessComponentTypes.indexOf(node.type) === -1) {
    return false;
  }

  if (node.type === 'Property') {
    if (
      isReactCreateClassCall(path.parent, importer) ||
      isReactComponentClass(path.parent, importer)
    ) {
      return false;
    }
  }

  if (returnsJSXElementOrReactCall(path, importer)) {
    return true;
  }

  return false;
}
