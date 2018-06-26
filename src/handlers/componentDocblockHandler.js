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
import { getDocblock } from '../utils/docblock';

var {
  types: { namedTypes: types },
} = recast;

function isClassDefinition(nodePath) {
  var node = nodePath.node;
  return (
    types.ClassDeclaration.check(node) || types.ClassExpression.check(node)
  );
}

/**
 * Finds the nearest block comment before the component definition.
 */
export default function componentDocblockHandler(
  documentation: Documentation,
  path: NodePath,
) {
  var description = null;

  if (isClassDefinition(path)) {
    // If we have a class declaration or expression, then the comment might be
    // attached to the last decorator instead as trailing comment.
    if (path.node.decorators && path.node.decorators.length > 0) {
      description = getDocblock(
        path.get('decorators', path.node.decorators.length - 1),
        true,
      );
    }
  }
  if (description == null) {
    // Find parent statement (e.g. var Component = React.createClass(<path>);)
    var searchPath = path;
    while (searchPath && !types.Statement.check(searchPath.node)) {
      searchPath = searchPath.parent;
    }
    if (searchPath) {
      // If the parent is an export statement, we have to traverse one more up
      if (
        types.ExportNamedDeclaration.check(searchPath.parentPath.node) ||
        types.ExportDefaultDeclaration.check(searchPath.parentPath.node)
      ) {
        searchPath = searchPath.parentPath;
      }
      description = getDocblock(searchPath);
    }
  }
  documentation.set('description', description || '');
}
