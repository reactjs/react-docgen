import type Documentation from '../Documentation.js';
import { getDocblock } from '../utils/docblock.js';
import isReactForwardRefCall from '../utils/isReactForwardRefCall.js';
import resolveToValue from '../utils/resolveToValue.js';
import type { NodePath } from '@babel/traverse';
import type { ComponentNode } from '../resolver/index.js';
import type { Handler } from './index.js';

function getDocblockFromComponent(path: NodePath): string | null {
  let description: string | null = null;

  if (path.isClassDeclaration() || path.isClassExpression()) {
    // If we have a class declaration or expression, then the comment might be
    // attached to the last decorator instead as trailing comment.
    if (path.node.decorators && path.node.decorators.length > 0) {
      description = getDocblock(
        path.get('decorators')[path.node.decorators.length - 1],
        true,
      );
    }
  }
  if (description == null) {
    // Find parent statement (e.g. var Component = React.createClass(<path>);)
    let searchPath: NodePath | null = path;

    while (searchPath && !searchPath.isStatement()) {
      searchPath = searchPath.parentPath;
    }
    if (searchPath) {
      // If the parent is an export statement, we have to traverse one more up
      if (
        searchPath.parentPath.isExportNamedDeclaration() ||
        searchPath.parentPath.isExportDefaultDeclaration()
      ) {
        searchPath = searchPath.parentPath;
      }
      description = getDocblock(searchPath);
    }
  }
  if (!description) {
    const searchPath = isReactForwardRefCall(path)
      ? path.get('arguments')[0]
      : path;
    const inner = resolveToValue(searchPath);

    if (inner.node !== path.node) {
      return getDocblockFromComponent(inner);
    }
  }

  return description;
}

/**
 * Finds the nearest block comment before the component definition.
 */
const componentDocblockHandler: Handler = function (
  documentation: Documentation,
  componentDefinition: NodePath<ComponentNode>,
): void {
  documentation.set(
    'description',
    getDocblockFromComponent(componentDefinition) || '',
  );
};

export default componentDocblockHandler;
