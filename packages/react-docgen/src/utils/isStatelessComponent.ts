import isReactCreateElementCall from './isReactCreateElementCall';
import isReactCloneElementCall from './isReactCloneElementCall';
import isReactChildrenElementCall from './isReactChildrenElementCall';
import type { NodePath } from '@babel/traverse';
import type { StatelessComponentNode } from '../resolver';
import findFunctionReturn from './findFunctionReturn';

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
