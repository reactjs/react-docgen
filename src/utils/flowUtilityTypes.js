/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import recast from 'recast';

const {
  types: { namedTypes: types },
} = recast;

const supportedUtilityTypes = new Set(['$Exact', '$ReadOnly']);

/**
 * See `supportedUtilityTypes` for which types are supported and
 * https://flow.org/en/docs/types/utilities/ for which types are available.
 */
export function isSupportedUtilityType(path: NodePath): boolean {
  if (types.GenericTypeAnnotation.check(path.node)) {
    const idPath = path.get('id');
    return Boolean(idPath) && supportedUtilityTypes.has(idPath.node.name);
  }
  return false;
}

/**
 * Unwraps well known utility types. For example:
 *
 *   $ReadOnly<T> => T
 */
export function unwrapUtilityType(path: NodePath): NodePath {
  return path.get('typeParameters', 'params', 0);
}
