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
import setPropDescription from '../utils/setPropDescription';
import getPropertyName from '../utils/getPropertyName';
import getFlowTypeFromReactComponent, {
  applyToFlowTypeProperties,
}  from '../utils/getFlowTypeFromReactComponent';
import resolveToValue from '../utils/resolveToValue';

const {types: {namedTypes: types}} = recast;
function setPropDescriptor(documentation: Documentation, path: NodePath): void {
  if (types.ObjectTypeSpreadProperty.check(path.node)) {
    const name = path.get('argument').get('id').get('name');
    const resolvedPath = resolveToValue(name);

    if (resolvedPath && types.TypeAlias.check(resolvedPath.node)) {
      const right = resolvedPath.get('right');
      applyToFlowTypeProperties(right, propertyPath => {
        setPropDescriptor(documentation, propertyPath)
      });
    } else {
      documentation.addComposes(name.value);
    }
  } else if (types.ObjectTypeProperty.check(path.node)) {
    let type = getFlowType(path.get('value'));
    let propDescriptor = documentation.getPropDescriptor(getPropertyName(path));
    propDescriptor.required = !path.node.optional;
    propDescriptor.flowType = type;

    // We are doing this here instead of in a different handler
    // to not need to duplicate the logic for checking for
    // imported types that are spread in to props.
    setPropDescription(documentation, path);
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
