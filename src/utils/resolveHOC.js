/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import types from 'ast-types';
import isReactCreateClassCall from './isReactCreateClassCall';
import isReactForwardRefCall from './isReactForwardRefCall';
import resolveToValue from './resolveToValue';

const { namedTypes: t } = types;

/**
 * If the path is a call expression, it recursively resolves to the
 * rightmost argument, stopping if it finds a React.createClass call expression
 *
 * Else the path itself is returned.
 */
export default function resolveHOC(path: NodePath): NodePath {
  const node = path.node;
  if (
    t.CallExpression.check(node) &&
    !isReactCreateClassCall(path) &&
    !isReactForwardRefCall(path)
  ) {
    if (node.arguments.length) {
      return resolveHOC(
        resolveToValue(path.get('arguments', node.arguments.length - 1)),
      );
    }
  }

  return path;
}
