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

import getMemberValuePath from '../utils/getMemberValuePath';
import resolveName from '../utils/resolveName';
import recast from 'recast';
import resolveToValue from '../utils/resolveToValue';

var {types: {namedTypes: types}} = recast;

export default function displayNameHandler(
  documentation: Documentation,
  path: NodePath
) {
  var displayNamePath = getMemberValuePath(path, 'displayName');

  if (displayNamePath) {
    displayNamePath = resolveToValue(displayNamePath);
    if (!displayNamePath || !types.Literal.check(displayNamePath.node)) {
      return;
    }
    displayNamePath = displayNamePath.node.value
  } else if (!displayNamePath && path.node.id) {
    displayNamePath = path.node.id.name;
  } else if (!displayNamePath && resolveName(path)){
    displayNamePath = resolveName(path)
  } else {
    return
  }

  documentation.set('displayName', displayNamePath);
}
