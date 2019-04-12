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
import { isSupportedUtilityType, unwrapUtilityType } from './flowUtilityTypes';

const {
  types: { namedTypes: types },
} = recast;

/**
 * Given an React component (stateless or class) tries to find the
 * flow type for the props. If not found or not one of the supported
 * component types returns null.
 */
export default function resolveGenericTypeAnnotation(
  path: NodePath,
): ?NodePath {
  // If the node doesn't have types or properties, try to get the type.
  let typePath: ?NodePath;
  if (path && isSupportedUtilityType(path)) {
    typePath = unwrapUtilityType(path);
  } else if (path && types.GenericTypeAnnotation.check(path.node)) {
    typePath = resolveToValue(path.get('id'));
    if (isUnreachableFlowType(typePath)) {
      return;
    }

    typePath = typePath.get('right');
  }

  return typePath;
}
