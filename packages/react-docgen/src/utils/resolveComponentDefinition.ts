import type { NodePath } from '@babel/traverse';
import type { ComponentNode } from '../resolver';
import isReactComponentClass from './isReactComponentClass';
import isReactCreateClassCall from './isReactCreateClassCall';
import isReactForwardRefCall from './isReactForwardRefCall';
import isStatelessComponent from './isStatelessComponent';
import normalizeClassDefinition from './normalizeClassDefinition';
import resolveToValue from './resolveToValue';

export function isComponentDefinition(
  path: NodePath,
): path is NodePath<ComponentNode> {
  return (
    isReactCreateClassCall(path) ||
    isReactComponentClass(path) ||
    isStatelessComponent(path) ||
    isReactForwardRefCall(path)
  );
}

export default function resolveComponentDefinition(
  definition: NodePath<ComponentNode>,
): NodePath<ComponentNode> | null {
  if (isReactCreateClassCall(definition)) {
    // return argument
    const resolvedPath = resolveToValue(definition.get('arguments')[0]);

    if (resolvedPath.isObjectExpression()) {
      return resolvedPath;
    }
  } else if (isReactComponentClass(definition)) {
    normalizeClassDefinition(definition);

    return definition;
  } else if (
    isStatelessComponent(definition) ||
    isReactForwardRefCall(definition)
  ) {
    return definition;
  }

  return null;
}
