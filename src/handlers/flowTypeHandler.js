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

import getFlowType from '../utils/getFlowType';
import getPropertyName from '../utils/getPropertyName';
import getFlowTypeFromReactComponent from '../utils/getFlowTypeFromReactComponent';

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

  flowTypesPath.get('properties').each(propertyPath => {
    const propDescriptor = documentation.getPropDescriptor(
      getPropertyName(propertyPath)
    );
    const valuePath = propertyPath.get('value');
    const type = getFlowType(valuePath);

    if (type) {
      propDescriptor.flowType = type;
      propDescriptor.required = !propertyPath.node.optional;
    }
  });
}
