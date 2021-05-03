import { namedTypes as t } from 'ast-types';
import type Documentation from '../Documentation';
import { getDocblock } from '../utils/docblock';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import resolveToValue from '../utils/resolveToValue';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

function isClassDefinition(nodePath: NodePath): boolean {
  const node = nodePath.node;
  return t.ClassDeclaration.check(node) || t.ClassExpression.check(node);
}

function getDocblockFromComponent(
  path: NodePath,
  importer: Importer,
): string | null {
  let description: string | null = null;

  if (isClassDefinition(path)) {
    // If we have a class declaration or expression, then the comment might be
    // attached to the last decorator instead as trailing comment.
    if (path.node.decorators && path.node.decorators.length > 0) {
      description = getDocblock(
        path.get('decorators', path.node.decorators.length - 1),
        true,
      );
    }
  }
  if (description == null) {
    // Find parent statement (e.g. var Component = React.createClass(<path>);)
    let searchPath = path;
    while (searchPath && !t.Statement.check(searchPath.node)) {
      searchPath = searchPath.parent;
    }
    if (searchPath) {
      // If the parent is an export statement, we have to traverse one more up
      if (
        t.ExportNamedDeclaration.check(searchPath.parentPath.node) ||
        t.ExportDefaultDeclaration.check(searchPath.parentPath.node)
      ) {
        searchPath = searchPath.parentPath;
      }
      description = getDocblock(searchPath);
    }
  }
  if (!description) {
    const searchPath = isReactForwardRefCall(path, importer)
      ? path.get('arguments', 0)
      : path;
    const inner = resolveToValue(searchPath, importer);
    if (inner.node !== path.node) {
      return getDocblockFromComponent(inner, importer);
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
  importer: Importer,
): void {
  documentation.set(
    'description',
    getDocblockFromComponent(path, importer) || '',
  );
}
