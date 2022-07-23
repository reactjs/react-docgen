import type Documentation from '../Documentation';
import { getDocblock } from '../utils/docblock';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import resolveToValue from '../utils/resolveToValue';
import type { NodePath, Node } from '@babel/traverse';
import type { ClassDeclaration, ClassExpression } from '@babel/types';

function isClassDefinition(
  path: NodePath,
): path is NodePath<ClassDeclaration | ClassExpression> {
  return path.isClassDeclaration() || path.isClassExpression();
}

function getDocblockFromComponent(path: NodePath): string | null {
  let description: string | null = null;

  if (isClassDefinition(path)) {
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
    let searchPath: NodePath<Node> | null = path;
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
export default function componentDocblockHandler(
  documentation: Documentation,
  path: NodePath,
): void {
  documentation.set('description', getDocblockFromComponent(path) || '');
}
