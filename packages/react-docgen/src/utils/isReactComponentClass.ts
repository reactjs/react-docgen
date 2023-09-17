import type { NodePath } from '@babel/traverse';
import type {
  ClassDeclaration,
  ClassExpression,
  ClassMethod,
} from '@babel/types';
import isReactModuleName from './isReactModuleName.js';
import resolveToModule from './resolveToModule.js';
import resolveToValue from './resolveToValue.js';
import isDestructuringAssignment from './isDestructuringAssignment.js';
import isImportSpecifier from './isImportSpecifier.js';

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

function classExtendsReactComponent(path: NodePath): boolean {
  if (path.isMemberExpression()) {
    const property = path.get('property');

    if (
      property.isIdentifier({ name: 'Component' }) ||
      property.isIdentifier({ name: 'PureComponent' })
    ) {
      return true;
    }
  } else if (
    isImportSpecifier(path, 'Component') ||
    isImportSpecifier(path, 'PureComponent')
  ) {
    return true;
  } else if (
    isDestructuringAssignment(path, 'Component') ||
    isDestructuringAssignment(path, 'PureComponent')
  ) {
    return true;
  }

  return false;
}

/**
 * Returns `true` of the path represents a class definition which either extends
 * `React.Component` or has a superclass and implements a `render()` method.
 */
export default function isReactComponentClass(
  path: NodePath,
): path is NodePath<ClassDeclaration | ClassExpression> {
  if (!path.isClass()) {
    return false;
  }

  // React.Component or React.PureComponent
  const superClass = path.get('superClass');

  if (superClass.hasNode()) {
    const resolvedSuperClass = resolveToValue(superClass);

    if (classExtendsReactComponent(resolvedSuperClass)) {
      const module = resolveToModule(resolvedSuperClass);

      if (module && isReactModuleName(module)) {
        return true;
      }
    }
  } else {
    // does not extend anything
    return false;
  }

  // render method
  if (path.get('body').get('body').some(isRenderMethod)) {
    return true;
  }

  return false;
}
