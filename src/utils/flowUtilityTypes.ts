import { namedTypes as t } from 'ast-types';
import type { NodePath } from 'ast-types/lib/node-path';

const supportedUtilityTypes = new Set(['$Exact', '$ReadOnly']);

/**
 * See `supportedUtilityTypes` for which types are supported and
 * https://flow.org/en/docs/types/utilities/ for which types are available.
 */
export function isSupportedUtilityType(path: NodePath): boolean {
  if (t.GenericTypeAnnotation.check(path.node)) {
    const idPath = path.get('id');
    return !!idPath && supportedUtilityTypes.has(idPath.node.name);
  }
  return false;
}

/**
 * Unwraps well known utility types. For example:
 *
 *   $ReadOnly<T> => T
 */
export function unwrapUtilityType(path: NodePath): NodePath {
  while (isSupportedUtilityType(path)) {
    path = path.get('typeParameters', 'params', 0);
  }

  return path;
}
