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

import getPropertyName from './getPropertyName';
import getTypeAnnotation from '../utils/getTypeAnnotation';
import getMemberValuePath from '../utils/getMemberValuePath';
import isReactComponentClass from '../utils/isReactComponentClass';
import isStatelessComponent from '../utils/isStatelessComponent';
import isUnreachableFlowType from '../utils/isUnreachableFlowType';
import recast from 'recast';
import resolveToValue from '../utils/resolveToValue';

var {types: {namedTypes: types}} = recast;

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
      typePath = superTypes.get('params').get(1);
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

  if (typePath && types.GenericTypeAnnotation.check(typePath.node)) {
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
