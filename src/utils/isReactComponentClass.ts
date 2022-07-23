import type { NodePath } from '@babel/traverse';
import type {
  ClassBody,
  ClassDeclaration,
  ClassExpression,
  ClassMethod,
} from '@babel/types';
import isReactModuleName from './isReactModuleName';
import match from './match';
import resolveToModule from './resolveToModule';
import resolveToValue from './resolveToValue';
import isDestructuringAssignment from './isDestructuringAssignment';

function isRenderMethod(path: NodePath): boolean {
  if (
    (!path.isClassMethod() || path.node.kind !== 'method') &&
    !path.isClassProperty()
  ) {
    return false;
  }

  if (path.node.computed || path.node.static) {
    return false;
  }

  const key = path.get('key') as NodePath<ClassMethod['key']>;
  if (!key.isIdentifier() || key.node.name !== 'render') {
    return false;
  }

  return true;
}

/**
 * Returns `true` of the path represents a class definition which either extends
 * `React.Component` or has a superclass and implements a `render()` method.
 */
export default function isReactComponentClass(
  path: NodePath,
): path is NodePath<ClassDeclaration | ClassExpression> {
  if (!path.isClassDeclaration() && !path.isClassExpression()) {
    return false;
  }

  // extends something
  if (!path.node.superClass) {
    return false;
  }

  // React.Component or React.PureComponent
  const superClass = resolveToValue(path.get('superClass') as NodePath);

  if (
    match(superClass.node, { property: { name: 'Component' } }) ||
    match(superClass.node, { property: { name: 'PureComponent' } }) ||
    isDestructuringAssignment(superClass, 'Component') ||
    isDestructuringAssignment(superClass, 'PureComponent')
  ) {
    const module = resolveToModule(superClass);
    if (module && isReactModuleName(module)) {
      return true;
    }
  }

  // render method
  if (
    (path.get('body') as NodePath<ClassBody>).get('body').some(isRenderMethod)
  ) {
    return true;
  }

  // check for @extends React.Component in docblock
  if (
    path.node.leadingComments &&
    path.node.leadingComments.some(function (comment) {
      return /@extends\s+React\.Component/.test(comment.value);
    })
  ) {
    return true;
  }

  return false;
}
