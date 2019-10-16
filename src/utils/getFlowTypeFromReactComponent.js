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

import getMemberValuePath from './getMemberValuePath';
import getTypeAnnotation from './getTypeAnnotation';
import isReactComponentClass from './isReactComponentClass';
import isReactForwardRefCall from './isReactForwardRefCall';
import resolveGenericTypeAnnotation from './resolveGenericTypeAnnotation';
import resolveToValue from './resolveToValue';

function getStatelessPropsPath(componentDefinition): NodePath {
  const value = resolveToValue(componentDefinition);
  if (isReactForwardRefCall(value)) {
    const inner = value.get('arguments', 0);
    return inner.get('params', 0);
  }
  return value.get('params', 0);
}

/**
 * Given an React component (stateless or class) tries to find the
 * flow type for the props. If not found or not one of the supported
 * component types returns null.
 */
export default (path: NodePath): ?NodePath => {
  let typePath: ?NodePath = null;

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

    return typePath;
  }

  const propsParam = getStatelessPropsPath(path);

  if (propsParam) {
    typePath = getTypeAnnotation(propsParam);
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
