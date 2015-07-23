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

import type Documentation from '../Documentation';

import {getDocblock} from '../utils/docblock';
import getPropertyName from '../utils/getPropertyName';
import getMemberValuePath from '../utils/getMemberValuePath';
import recast from 'recast';
import resolveToValue from '../utils/resolveToValue';

var {types: {namedTypes: types}} = recast;

export default function propDocBlockHandler(
  documentation: Documentation,
  path: NodePath
) {
  var propTypesPath = getMemberValuePath(path, 'propTypes');
  if (!propTypesPath) {
    return;
  }
  propTypesPath = resolveToValue(propTypesPath);
  if (!propTypesPath || !types.ObjectExpression.check(propTypesPath.node)) {
    return;
  }

  propTypesPath.get('properties').each(function(propertyPath) {
    // we only support documentation of actual properties, not spread
    if (types.Property.check(propertyPath.node)) {
      var propDescriptor = documentation.getPropDescriptor(
        getPropertyName(propertyPath)
      );
      propDescriptor.description = getDocblock(propertyPath) || '';
    }
  });
}
