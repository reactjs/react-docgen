import { ASTNode, namedTypes as t } from 'ast-types';
import isReactModuleName from './isReactModuleName';
import match from './match';
import resolveToModule from './resolveToModule';
import resolveToValue from './resolveToValue';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

function isRenderMethod(node: ASTNode): boolean {
  const isProperty = node.type === 'ClassProperty';
  return Boolean(
    (t.MethodDefinition.check(node) || isProperty) &&
      // @ts-ignore
      !node.computed &&
      // @ts-ignore
      !node.static &&
      // @ts-ignore
      (node.kind === '' || node.kind === 'method' || isProperty) &&
      // @ts-ignore
      node.key.name === 'render',
  );
}

/**
 * Returns `true` of the path represents a class definition which either extends
 * `React.Component` or has a superclass and implements a `render()` method.
 */
export default function isReactComponentClass(
  path: NodePath,
  importer: Importer,
): boolean {
  const node = path.node;
  if (!t.ClassDeclaration.check(node) && !t.ClassExpression.check(node)) {
    return false;
  }

  // extends something
  if (!node.superClass) {
    return false;
  }

  // React.Component or React.PureComponent
  const superClass = resolveToValue(path.get('superClass'), importer);
  if (
    match(superClass.node, { property: { name: 'Component' } }) ||
    match(superClass.node, { property: { name: 'PureComponent' } })
  ) {
    const module = resolveToModule(superClass, importer);
    if (module && isReactModuleName(module)) {
      return true;
    }
  }

  // render method
  if (node.body.body.some(isRenderMethod)) {
    return true;
  }

  // check for @extends React.Component in docblock
  if (path.parentPath && path.parentPath.value) {
    const classDeclaration = Array.isArray(path.parentPath.value)
      ? path.parentPath.value.find(function (declaration) {
          return declaration.type === 'ClassDeclaration';
        })
      : path.parentPath.value;

    if (
      classDeclaration &&
      classDeclaration.leadingComments &&
      classDeclaration.leadingComments.some(function (comment) {
        return /@extends\s+React\.Component/.test(comment.value);
      })
    ) {
      return true;
    }
  }

  return false;
}
