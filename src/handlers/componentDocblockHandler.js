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
import {getDocblock, getTrailingDocblock} from '../utils/docblock';

var {types: {namedTypes: types}} = recast;

function isClassDefinition(nodePath) {
  var node = nodePath.node;
  return types.ClassDeclaration.check(node) ||
    types.ClassExpression.check(node);
}

function isExport(path) {
  return (
    types.ExportNamedDeclaration.check(path.node) ||
    types.ExportDefaultDeclaration.check(path.node)
  );
}

/**
 * Finds the nearest block comment before the component definition.
 */
export default function componentDocblockHandler(
  documentation: Documentation,
  path: NodePath
) {
  var description = null;
  // Find parent statement (e.g. var Component = React.createClass(<path>);)
  var searchPath = path;
  while (searchPath && !types.Statement.check(searchPath.node)) {
    searchPath = searchPath.parent;
  }
  if (searchPath) {
    // If the parent is an export statement, we have to traverse one more up
    if (isExport(searchPath.parentPath)) {
      searchPath = searchPath.parentPath;
    }
    description = getDocblock(searchPath);
  }
  if (description == null && isClassDefinition(path)) {
    // This is a class definition, but we didn't find the docblock on the
    // class definition node itself. Either there is no docblock, or decorators
    // are obscuring it.

    // Normally the leading docblock comments are attached to the first decorator,
    // but with the Flow parser (as of 0.34) and recast, bugs lead to them being
    // in weird places.

    // if there is a comment above the class definition and there are decorators like so:
    // @Decorator
    // /**
    //  * My Docblock
    //  */
    // export default class Foo {}
    //
    // ...the comments may be attached to the id property of the class declaration.

    // ...except in the case of an anonymous default export:
    // @Decorator
    // /**
    //  * My Docblock
    //  */
    // export default class {}
    //
    // ...since there is no name, the comment is attached to the class body.
    description = getDocblock(path.get('id')) || getDocblock(path.get('body'));
    if (!description && path.node.decorators && path.node.decorators.length > 0) {
      // We'll need to traverse up one if the comment is above an export statement
      if (isExport(path.parent)) {
        searchPath = path.parent;
      }

      // Because of Flow + recast, the docblock might be in the *previous* node's
      // *trailing* comment.
      description = getTrailingDocblock(searchPath.parentPath.get(searchPath.name - 1));
    }
  }
  if (description == null) {
    // If this is the first statement in the module body, the comment is attached
    // to the program node
    var programPath = searchPath;
    while (programPath && !types.Program.check(programPath.node)) {
      programPath = programPath.parent;
    }
    if (programPath.get('body', 0) === searchPath) {
      description = getDocblock(programPath);
    }
  }
  documentation.set('description', description || '');
}
