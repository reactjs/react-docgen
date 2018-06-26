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

import getMemberValuePath from '../utils/getMemberValuePath';
import recast from 'recast';
import resolveToModule from '../utils/resolveToModule';
import resolveToValue from '../utils/resolveToValue';

var {
  types: { namedTypes: types },
} = recast;

/**
 * It resolves the path to its module name and adds it to the "composes" entry
 * in the documentation.
 */
function amendComposes(documentation, path) {
  var moduleName = resolveToModule(path);
  if (moduleName) {
    documentation.addComposes(moduleName);
  }
}

function processObjectExpression(documentation, path) {
  path.get('properties').each(function(propertyPath) {
    switch (propertyPath.node.type) {
      case types.SpreadProperty.name: // bc for older estree version
      case types.SpreadElement.name:
        var resolvedValuePath = resolveToValue(propertyPath.get('argument'));
        amendComposes(documentation, resolvedValuePath);
        break;
    }
  });
}

export default function propTypeCompositionHandler(
  documentation: Documentation,
  path: NodePath,
) {
  var propTypesPath = getMemberValuePath(path, 'propTypes');
  if (!propTypesPath) {
    return;
  }
  propTypesPath = resolveToValue(propTypesPath);
  if (!propTypesPath) {
    return;
  }

  switch (propTypesPath.node.type) {
    case types.ObjectExpression.name:
      processObjectExpression(documentation, propTypesPath);
      break;
    default:
      amendComposes(documentation, propTypesPath);
      break;
  }
}
