/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import isUnreachableFlowType from '../utils/isUnreachableFlowType';
import recast from 'recast';
import resolveToValue from '../utils/resolveToValue';
import { unwrapUtilityType } from './flowUtilityTypes';

const {
  types: { namedTypes: types },
} = recast;

function tryResolveGenericTypeAnnotation(path: NodePath): ?NodePath {
  let typePath = unwrapUtilityType(path);

  if (types.GenericTypeAnnotation.check(typePath.node)) {
    typePath = resolveToValue(typePath.get('id'));
    if (isUnreachableFlowType(typePath)) {
      return;
    }

    return tryResolveGenericTypeAnnotation(typePath.get('right'));
  } else if (types.TSTypeReference.check(typePath.node)) {
    typePath = resolveToValue(typePath.get('typeName'));
    if (isUnreachableFlowType(typePath)) {
      return;
    }

    return tryResolveGenericTypeAnnotation(typePath.get('typeAnnotation'));
  }

  return typePath;
}

/**
 * Given an React component (stateless or class) tries to find the
 * flow type for the props. If not found or not one of the supported
 * component types returns undefined.
 */
export default function resolveGenericTypeAnnotation(
  path: NodePath,
): ?NodePath {
  if (!path) return;

  const typePath = tryResolveGenericTypeAnnotation(path);

  if (!typePath || typePath === path) return;

  return typePath;
}
