/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import recast from 'recast';
import resolveToValue from './resolveToValue';

var {types: {namedTypes: _types}} = recast; //eslint-disable-line no-unused-vars

export default function resolveExportDeclaration(
  path: NodePath,
  types: Object = _types
): Array<NodePath> {
  var definitions = [];
  if (path.node.default) {
    definitions.push(path.get('declaration'));
  } else if (path.node.declaration) {
    if (types.VariableDeclaration.check(path.node.declaration)) {
      path.get('declaration', 'declarations').each(
        declarator => definitions.push(declarator)
      );
    } else {
      definitions.push(path.get('declaration'));
    }
  } else if (path.node.specifiers) {
    path.get('specifiers').each(
      specifier => definitions.push(specifier.get('id'))
    );
  }
  return definitions.map(definition => resolveToValue(definition));
}
