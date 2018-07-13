/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
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
