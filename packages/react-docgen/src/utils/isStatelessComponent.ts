import isReactCreateElementCall from './isReactCreateElementCall.js';
import isReactCloneElementCall from './isReactCloneElementCall.js';
import isReactChildrenElementCall from './isReactChildrenElementCall.js';
import type { NodePath } from '@babel/traverse';
import type { StatelessComponentNode } from '../resolver/index.js';
import findFunctionReturn from './findFunctionReturn.js';

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

/**
 * Returns `true` if the path represents a function which returns a JSXElement
 */
export default function isStatelessComponent(
  path: NodePath,
): path is NodePath<StatelessComponentNode> {
  if (!path.inType(...validPossibleStatelessComponentTypes)) {
    return false;
  }

  const foundPath = findFunctionReturn(path, isJSXElementOrReactCall);

  return Boolean(foundPath);
}
