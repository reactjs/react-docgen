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
import isReactCreateClassCall from '../utils/isReactCreateClassCall';
import isStatelessComponent from '../utils/isStatelessComponent';
import normalizeClassDefinition from '../utils/normalizeClassDefinition';
import resolveToValue from '../utils/resolveToValue';

/**
 * Given an AST, this function tries to find all object expressions that are
 * passed to `React.createClass` calls, by resolving all references properly.
 */
export default function findAllReactCreateClassCalls(
  ast: ASTNode,
  recast: Object
): Array<NodePath> {
  var types = recast.types.namedTypes;
  var definitions = [];

  function classVisitor(path) {
    if (isReactComponentClass(path)) {
      normalizeClassDefinition(path);
      definitions.push(path);
    }
    return false;
  }

  function statelessVisitor(path) {
    if (isStatelessComponent(path)) {
      definitions.push(path);
    }
    return false;
  }

  recast.visit(ast, {
    visitFunctionDeclaration: statelessVisitor,
    visitFunctionExpression: statelessVisitor,
    visitArrowFunctionExpression: statelessVisitor,
    visitClassExpression: classVisitor,
    visitClassDeclaration: classVisitor,
    visitCallExpression: function(path) {
      if (!isReactCreateClassCall(path)) {
        return false;
      }
      var resolvedPath = resolveToValue(path.get('arguments', 0));
      if (types.ObjectExpression.check(resolvedPath.node)) {
        definitions.push(resolvedPath);
      }
      return false;
    },
  });

  return definitions;
}
