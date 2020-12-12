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
import type { Importer } from '../types';

/**
 * Given a path (e.g. call expression, member expression or identifier),
 * this function tries to find the name of module from which the "root value"
 * was imported.
 */
export default function resolveToModule(
  path: NodePath,
  importer: Importer,
): ?string {
  const node = path.node;
  switch (node.type) {
    case t.VariableDeclarator.name:
      if (node.init) {
        return resolveToModule(path.get('init'), importer);
      }
      break;
    case t.CallExpression.name:
      if (match(node.callee, { type: t.Identifier.name, name: 'require' })) {
        return node.arguments[0].value;
      }
      return resolveToModule(path.get('callee'), importer);
    case t.Identifier.name:
    case t.JSXIdentifier.name: {
      const valuePath = resolveToValue(path, importer);
      if (valuePath !== path) {
        return resolveToModule(valuePath, importer);
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
        return resolveToModule(path, importer);
      }
  }

  return null;
}
