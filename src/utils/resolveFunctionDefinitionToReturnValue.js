/*
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import resolveToValue from './resolveToValue';
import { traverseShallow } from './traverse';

export default function resolveFunctionDefinitionToReturnValue(
  path: NodePath,
): ?NodePath {
  let returnPath = null;

  traverseShallow(path.get('body'), {
    visitFunction: () => false,
    visitReturnStatement: nodePath => {
      returnPath = resolveToValue(nodePath.get('argument'));
      return false;
    },
  });

  return returnPath;
}
