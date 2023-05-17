import type { NodePath } from '@babel/traverse';
import type { ComponentNode } from '../resolver/index.js';
import isReactComponentClass from './isReactComponentClass.js';
import isReactCreateClassCall from './isReactCreateClassCall.js';
import isReactForwardRefCall from './isReactForwardRefCall.js';
import isStatelessComponent from './isStatelessComponent.js';
import normalizeClassDefinition from './normalizeClassDefinition.js';
import resolveHOC from './resolveHOC.js';
import resolveToValue from './resolveToValue.js';

function isComponentDefinition(
  path: NodePath,
): path is NodePath<ComponentNode> {
  return (
    isReactCreateClassCall(path) ||
    isReactComponentClass(path) ||
    isStatelessComponent(path) ||
    isReactForwardRefCall(path)
  );
}

function resolveComponentDefinition(
  definition: NodePath<ComponentNode>,
): NodePath<ComponentNode> | null {
  if (isReactCreateClassCall(definition)) {
    // return argument
    const resolvedPath = resolveToValue(definition.get('arguments')[0]!);

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

export default function findComponentDefinition(
  path: NodePath,
): NodePath<ComponentNode> | null {
  let resolvedPath = path;

  if (!isComponentDefinition(resolvedPath)) {
    resolvedPath = resolveToValue(resolveHOC(resolvedPath));
    if (!isComponentDefinition(resolvedPath)) {
      return null;
    }
  }

  return resolveComponentDefinition(resolvedPath);
}
