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

import getTypeAnnotation from '../utils/getTypeAnnotation';
import getMemberValuePath from '../utils/getMemberValuePath';
import isReactComponentClass from '../utils/isReactComponentClass';
import isStatelessComponent from '../utils/isStatelessComponent';
import isUnreachableFlowType from '../utils/isUnreachableFlowType';
import recast from 'recast';
import resolveToValue from '../utils/resolveToValue';
import {
  isSupportedUtilityType,
  unwrapUtilityType,
} from '../utils/flowUtilityTypes';
import resolveGenericTypeAnnotation from '../utils/resolveGenericTypeAnnotation';

const {
  types: { namedTypes: types },
} = recast;

/**
 * Given an React component (stateless or class) tries to find the
 * flow type for the props. If not found or not one of the supported
 * component types returns null.
 */
export default (path: NodePath): ?NodePath => {
  let typePath: ?NodePath;

  if (isReactComponentClass(path)) {
    const superTypes = path.get('superTypeParameters');

    if (superTypes.value) {
      const params = superTypes.get('params');
      if (params.value.length === 3) {
        typePath = params.get(1);
      } else {
        typePath = params.get(0);
      }
    } else {
      const propsMemberPath = getMemberValuePath(path, 'props');
      if (!propsMemberPath) {
        return null;
      }

      typePath = getTypeAnnotation(propsMemberPath.parentPath);
    }
  } else if (isStatelessComponent(path)) {
    const param = path.get('params').get(0);

    typePath = getTypeAnnotation(param);
  }

  if (typePath && isSupportedUtilityType(typePath)) {
    typePath = unwrapUtilityType(typePath);
  } else if (typePath && types.GenericTypeAnnotation.check(typePath.node)) {
    typePath = resolveToValue(typePath.get('id'));
    if (
      !typePath ||
      types.Identifier.check(typePath.node) ||
      isUnreachableFlowType(typePath)
    ) {
      return;
    }

    typePath = typePath.get('right');
  }

  return typePath;
};

export function applyToFlowTypeProperties(
  path: NodePath,
  callback: (propertyPath: NodePath) => void,
) {
  if (path.node.properties) {
    path.get('properties').each(propertyPath => callback(propertyPath));
  } else if (path.node.type === 'IntersectionTypeAnnotation') {
    path
      .get('types')
      .each(typesPath => applyToFlowTypeProperties(typesPath, callback));
  } else if (path.node.type !== 'UnionTypeAnnotation') {
    // The react-docgen output format does not currently allow
    // for the expression of union types
    const typePath = resolveGenericTypeAnnotation(path);
    if (typePath) {
      applyToFlowTypeProperties(typePath, callback);
    }
  }
}
