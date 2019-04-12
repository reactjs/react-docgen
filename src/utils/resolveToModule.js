/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import match from './match';
import recast from 'recast';
import resolveToValue from './resolveToValue';

const {
  types: { namedTypes: types },
} = recast;

/**
 * Given a path (e.g. call expression, member expression or identifier),
 * this function tries to find the name of module from which the "root value"
 * was imported.
 */
export default function resolveToModule(path: NodePath): ?string {
  const node = path.node;
  switch (node.type) {
    case types.VariableDeclarator.name:
      if (node.init) {
        return resolveToModule(path.get('init'));
      }
      break;
    case types.CallExpression.name:
      if (
        match(node.callee, { type: types.Identifier.name, name: 'require' })
      ) {
        return node.arguments[0].value;
      }
      return resolveToModule(path.get('callee'));
    case types.Identifier.name:
    case types.JSXIdentifier.name: {
      const valuePath = resolveToValue(path);
      if (valuePath !== path) {
        return resolveToModule(valuePath);
      }
      break;
    }
    case types.ImportDeclaration.name:
      return node.source.value;
    case types.MemberExpression.name:
      while (path && types.MemberExpression.check(path.node)) {
        path = path.get('object');
      }
      if (path) {
        return resolveToModule(path);
      }
  }

  return null;
}
