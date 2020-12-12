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
import resolveToModule from './resolveToModule';
import isReactBuiltinCall from './isReactBuiltinCall';
import type { Importer } from '../types';

/**
 * Returns true if the expression is a function call of the form
 * ```
 * import createReactClass from 'create-react-class';
 * createReactClass(...);
 * ```
 */
function isReactCreateClassCallModular(
  path: NodePath,
  importer: Importer,
): boolean {
  if (t.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }

  if (!match(path.node, { type: 'CallExpression' })) {
    return false;
  }
  const module = resolveToModule(path, importer);
  return Boolean(module && module === 'create-react-class');
}

/**
 * Returns true if the expression is a function call of the form
 * `React.createClass(...)` or
 * ```
 * import createReactClass from 'create-react-class';
 * createReactClass(...);
 * ```
 */
export default function isReactCreateClassCall(
  path: NodePath,
  importer: Importer,
): boolean {
  return (
    isReactBuiltinCall(path, 'createClass', importer) ||
    isReactCreateClassCallModular(path, importer)
  );
}
