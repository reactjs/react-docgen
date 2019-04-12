/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Documentation from '../Documentation';

import getMemberValuePath from '../utils/getMemberValuePath';
import recast from 'recast';
import resolveToModule from '../utils/resolveToModule';
import resolveToValue from '../utils/resolveToValue';

const {
  types: { namedTypes: types },
} = recast;

/**
 * It resolves the path to its module name and adds it to the "composes" entry
 * in the documentation.
 */
function amendComposes(documentation, path) {
  const moduleName = resolveToModule(path);
  if (moduleName) {
    documentation.addComposes(moduleName);
  }
}

function processObjectExpression(documentation, path) {
  path.get('properties').each(function(propertyPath) {
    switch (propertyPath.node.type) {
      case types.SpreadElement.name:
        amendComposes(
          documentation,
          resolveToValue(propertyPath.get('argument')),
        );
        break;
    }
  });
}

export default function propTypeCompositionHandler(
  documentation: Documentation,
  path: NodePath,
) {
  let propTypesPath = getMemberValuePath(path, 'propTypes');
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
