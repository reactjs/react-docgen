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


import match from './match';
import recast from 'recast';
import resolveToValue from './resolveToValue';

var {types: {namedTypes: types}} = recast;

/**
 * Given a path (e.g. call expression, member expression or identifier),
 * this function tries to find the name of module from which the "root value"
 * was imported.
 */
export default function resolveToIdentifier(path: NodePath, name: String): ?string {
  name = name || path.value.name
  var node = path.node;
  switch (node.type) {
    case types.VariableDeclarator.name:
      if (node.init) {
        return resolveToIdentifier(path.get('init'), name);
      }
      break;
    case types.CallExpression.name:
      if (match(node.callee, {type: types.Identifier.name, name: 'require'})) {
        if (path.parentPath.value.id) {
          return path.parentPath.value.id.name
        }
        if (path.parentPath.value.property) {
          return path.parentPath.value.property.name
        }
      }
      return resolveToIdentifier(path.get('callee'), name);
    case types.Identifier.name:
    case types.JSXIdentifier.name:
      var valuePath = resolveToValue(path);
      if (valuePath !== path) {
        return resolveToIdentifier(valuePath, name);
      }
      break;
    case types.ImportDeclaration.name:
      const specifier = node.specifiers.find(specifier => specifier.local.name === name) || node.specifiers[0]
      return (specifier.imported || specifier.local).name;
    case types.MemberExpression.name:
      while (path && types.MemberExpression.check(path.node)) {
        path = path.get('object');
      }
      if (path) {
        return resolveToIdentifier(path, name);
      }
  }
  return node.name;
}
