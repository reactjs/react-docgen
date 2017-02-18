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

import getPropType from '../utils/getPropType';
import getPropertyName from '../utils/getPropertyName';
import getMemberValuePath from '../utils/getMemberValuePath';
import isReactModuleName from '../utils/isReactModuleName';
import isRequiredPropType from '../utils/isRequiredPropType';
import printValue from '../utils/printValue';
import recast from 'recast';
import resolveToModule from '../utils/resolveToModule';
import resolveToValue from '../utils/resolveToValue';


var {types: {namedTypes: types}} = recast;

function isPropTypesExpression(path) {
  var moduleName = resolveToModule(path);
  if (moduleName) {
    return isReactModuleName(moduleName) || moduleName === 'ReactPropTypes';
  }
  return false;
}

function amendPropTypes(documentation, path) {
  if (!types.ObjectExpression.check(path.node)) {
    return;
  }

  path.get('properties').each(function(propertyPath) {
    switch (propertyPath.node.type) {
      case types.Property.name:
        var propDescriptor = documentation.getPropDescriptor(
          getPropertyName(propertyPath)
        );
        var valuePath = propertyPath.get('value');
        var type = isPropTypesExpression(valuePath) ?
          getPropType(valuePath) :
          {name: 'custom', raw: printValue(valuePath)};

        if (type) {
          propDescriptor.type = type;
          propDescriptor.required =
            type.name !== 'custom' && isRequiredPropType(valuePath);
        }
        break;
      case types.SpreadProperty.name: // bc for older estree version
      case types.SpreadElement.name:
        var resolvedValuePath = resolveToValue(propertyPath.get('argument'));
        switch (resolvedValuePath.node.type) {
          case types.ObjectExpression.name: // normal object literal
            amendPropTypes(documentation, resolvedValuePath);
            break;
        }
        break;
    }
  });
}

export default function propTypeHandler(
  documentation: Documentation,
  path: NodePath
) {
  var propTypesPath = getMemberValuePath(path, 'propTypes');
  if (!propTypesPath) {
    return;
  }
  propTypesPath = resolveToValue(propTypesPath);
  if (!propTypesPath) {
    return;
  }
  amendPropTypes(documentation, propTypesPath);
}
