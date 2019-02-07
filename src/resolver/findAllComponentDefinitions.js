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
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import isStatelessComponent from '../utils/isStatelessComponent';
import normalizeClassDefinition from '../utils/normalizeClassDefinition';
import resolveToValue from '../utils/resolveToValue';

/**
 * Given an AST, this function tries to find all object expressions that are
 * passed to `React.createClass` calls, by resolving all references properly.
 */
export default function findAllReactCreateClassCalls(
  ast: ASTNode,
  recast: Object,
): Array<NodePath> {
  const types = recast.types.namedTypes;
  const definitions = new Set();

  function classVisitor(path) {
    if (isReactComponentClass(path)) {
      normalizeClassDefinition(path);
      definitions.add(path);
    }
    return false;
  }

  function statelessVisitor(path) {
    if (isStatelessComponent(path)) {
      definitions.add(path);
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
      if (isReactForwardRefCall(path)) {
        // If the the inner function was previously identified as a component
        // replace it with the parent node
        const inner = resolveToValue(path.get('arguments', 0));
        definitions.delete(inner);
        definitions.add(path);
      } else if (isReactCreateClassCall(path)) {
        const resolvedPath = resolveToValue(path.get('arguments', 0));
        if (types.ObjectExpression.check(resolvedPath.node)) {
          definitions.add(resolvedPath);
        }
      }
      return false;
    },
  });

  return Array.from(definitions);
}
