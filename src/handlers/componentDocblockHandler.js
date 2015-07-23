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

import recast from 'recast';
import {getDocblock} from '../utils/docblock';

var {types: {namedTypes: types}} = recast;

/**
 * Finds the nearest block comment before the component definition.
 */
export default function componentDocblockHandler(
  documentation: Documentation,
  path: NodePath
) {
  var description = null;
  // Find parent statement (e.g. var Component = React.createClass(<path>);)
  while (path && !types.Statement.check(path.node)) {
    path = path.parent;
  }
  if (path) {
    description = getDocblock(path);
  }
  if (description == null) {
    // If this is the first statement in the module body, the comment is attached
    // to the program node
    var programPath = path;
    while (programPath && !types.Program.check(programPath.node)) {
      programPath = programPath.parent;
    }
    if (programPath.get('body', 0) === path) {
      description = getDocblock(programPath);
    }
  }
  documentation.setDescription(description || '');
}
