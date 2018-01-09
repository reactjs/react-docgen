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
import recast from 'recast';

import type Documentation from '../Documentation';

import getFlowType from '../utils/getFlowType';
import getPropertyName from '../utils/getPropertyName';
import getFlowTypeFromReactComponent, {
  applyToFlowTypeProperties,
}  from '../utils/getFlowTypeFromReactComponent';

const {types: {namedTypes: types}} = recast;
function setPropDescriptor(documentation: Documentation, path: NodePath): void {
  let propDescriptor = documentation.getPropDescriptor(getPropertyName(path));
  let type;

  if (types.ObjectTypeSpreadProperty.check(path.node)) {
    type = getFlowType(path.get('argument'));
    propDescriptor.inherited = true;
  } else if (types.ObjectTypeProperty.check(path.node)) {
    type = getFlowType(path.get('value'));
    propDescriptor.required = !path.node.optional;
  }

  if (type) {
    propDescriptor.flowType = type;
  }
}

/**
 * This handler tries to find flow Type annotated react components and extract
 * its types to the documentation. It also extracts docblock comments which are
 * inlined in the type definition.
 */
export default function flowTypeHandler(documentation: Documentation, path: NodePath) {
  let flowTypesPath = getFlowTypeFromReactComponent(path);

  if (!flowTypesPath) {
    return;
  }

  applyToFlowTypeProperties(flowTypesPath, propertyPath => {
      setPropDescriptor(documentation, propertyPath)
  });
}
