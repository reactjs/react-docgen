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
import setPropDescription from '../utils/setPropDescription';
import getFlowTypeFromReactComponent, {
  applyToFlowTypeProperties,
}  from '../utils/getFlowTypeFromReactComponent';

/**
 * This handler tries to find flow Type annotated react components and extract
 * its types to the documentation. It also extracts docblock comments which are
 * inlined in the type definition.
 */
export default function flowTypeDocBlockHandler(documentation: Documentation, path: NodePath) {
  const flowTypesPath = getFlowTypeFromReactComponent(path);

  if (!flowTypesPath || !flowTypesPath.node.properties) {
    return;
  }

  applyToFlowTypeProperties(flowTypesPath, propertyPath =>
    setPropDescription(documentation, propertyPath)
  );
}
