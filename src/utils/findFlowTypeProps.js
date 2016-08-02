/*
 * Copyright (c) 2016, Facebook, Inc.
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
type SetPropCallback = (documentation: Documentation, path: NodePath) => void

/**
 * Tries to find all props from the flow annotation and calls the setPropCallback for each one.
 * The callback can be called multiple times for the same prop (Union, Intersection).
 */
export default function findFlowTypeProps(documentation: Documentation, path: NodePath, setPropCallback: SetPropCallback): void {
  if (path.node.properties) {
    path.get('properties').each(
      propertyPath => setPropCallback(documentation, propertyPath)
    );
  } else if (path.node.types) {
    path.get('types').each(
      typesPath => findFlowTypeProps(documentation, typesPath, setPropCallback)
    );
  }
}
