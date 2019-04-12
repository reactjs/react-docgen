/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
