/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
import match from './match';
import resolveToValue from './resolveToValue';
import ignoreImports from '../importer/ignoreImports';

/**
 * Given a path (e.g. call expression, member expression or identifier),
 * this function tries to find the name of module from which the "root value"
 * was imported.
 */
export default function resolveToModule(path: NodePath): ?string {
  const node = path.node;
  switch (node.type) {
    case t.VariableDeclarator.name:
      if (node.init) {
        return resolveToModule(path.get('init'));
      }
      break;
    case t.CallExpression.name:
      if (match(node.callee, { type: t.Identifier.name, name: 'require' })) {
        return node.arguments[0].value;
      }
      return resolveToModule(path.get('callee'));
    case t.Identifier.name:
    case t.JSXIdentifier.name: {
      const valuePath = resolveToValue(path, ignoreImports);
      if (valuePath !== path) {
        return resolveToModule(valuePath);
      }
      break;
    }
    case t.ImportDeclaration.name:
      return node.source.value;
    case t.MemberExpression.name:
      while (path && t.MemberExpression.check(path.node)) {
        path = path.get('object');
      }
      if (path) {
        return resolveToModule(path);
      }
  }

  return null;
}
