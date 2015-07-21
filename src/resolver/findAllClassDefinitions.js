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

import isReactComponentClass from '../utils/isReactComponentClass';
import normalizeClassDefinition from '../utils/normalizeClassDefinition';

/**
 * Given an AST, this function tries to find all object expressions that are
 * passed to `React.createClass` calls, by resolving all references properly.
 */
export default function findAllClassDefinitions(
  ast: ASTNode,
  recast: Object
): Array<NodePath> {
  var definitions = [];

  function visitor(path) {
    if (isReactComponentClass(path)) {
      normalizeClassDefinition(path);
      definitions.push(path);
    }
    return false;
  }

  recast.visit(ast, {
    visitClassExpression: visitor,
    visitClassDeclaration: visitor,
  });

  return definitions;
}
