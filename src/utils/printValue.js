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

var {types: {namedTypes: types}} = recast;

/**
 * Prints the given path without leading or trailing comments.
 */
export default function printValue(path: NodePath): string {
  if (path.node.comments) {
    path.node.comments.length = 0;
  }

  if(types.TypeCastExpression.check(path.node)) {
    return recast.print(path.node.expression).code
  } else {
    return recast.print(path).code;
  }
}
