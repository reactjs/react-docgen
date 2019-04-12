/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import recast from 'recast';

/**
 * Prints the given path without leading or trailing comments.
 */
export default function printValue(path: NodePath): string {
  if (path.node.comments) {
    path.node.comments.length = 0;
  }

  return recast.print(path).code;
}
