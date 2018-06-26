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

const {types: {namedTypes: types}} = recast;

const supportedUtilityTypes = new Set(['$Exact', '$ReadOnly']);

/**
 * Given an React component (stateless or class) tries to find the
 * flow type for the props. If not found or not one of the supported
 * component types returns null.
 */
export default (path: NodePath): ?NodePath  => {
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
}

export function applyToFlowTypeProperties(
  path: NodePath,
  callback: (propertyPath: NodePath) => void
) {
  if (path.node.properties) {
    path.get('properties').each(
      propertyPath => callback(propertyPath)
    );
  } else if (path.node.type === 'IntersectionTypeAnnotation') {
    path.get('types').each(
      typesPath => applyToFlowTypeProperties(typesPath, callback)
    );
  } else if (path.node.type !== 'UnionTypeAnnotation') {
    // The react-docgen output format does not currently allow
    // for the expression of union types
    let typePath = resolveGenericTypeAnnotation(path);
    if (typePath) {
      applyToFlowTypeProperties(typePath, callback);
    }
  }
}

function resolveGenericTypeAnnotation(path: NodePath): ?NodePath {
  // If the node doesn't have types or properties, try to get the type.
  let typePath: ?NodePath;
  if (path && isSupportedUtilityType(path)) {
    typePath = unwrapUtilityType(path);
  } else if(path && types.GenericTypeAnnotation.check(path.node)) {
    typePath = resolveToValue(path.get('id'));
    if (isUnreachableFlowType(typePath)) {
      return;
    }

    typePath = typePath.get('right');
  }

  return typePath;
}

/**
 * See `supportedUtilityTypes` for which types are supported and
 * https://flow.org/en/docs/types/utilities/ for which types are available.
 */
function isSupportedUtilityType (path: NodePath): boolean {
  if (types.GenericTypeAnnotation.check(path.node)) {
    const idPath = path.get('id');
    return Boolean(idPath) &&
      supportedUtilityTypes.has(idPath.node.name);
  }
  return false;
}

/**
 * Unwraps well known utility types. For example:
 *
 *   $ReadOnly<T> => T
 */
function unwrapUtilityType(path: NodePath): ?NodePath {
  return path.get('typeParameters', 'params', 0);
}
