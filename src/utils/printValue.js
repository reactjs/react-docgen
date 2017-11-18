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

/**
 * Prints the given path without leading or trailing comments.
 */
export default function printValue(path: NodePath): string {
  if (path.node.comments) {
    path.node.comments.length = 0;
  }

  return recast.print(path).code;
}
