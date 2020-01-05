/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/*eslint no-loop-func: 0, no-use-before-define: 0*/

import { namedTypes as t } from 'ast-types';
import resolveToValue from './resolveToValue';

/**
 * Splits a MemberExpression or CallExpression into parts.
 * E.g. foo.bar.baz becomes ['foo', 'bar', 'baz']
 */
function toArray(path: NodePath): Array<string> {
  const parts = [path];
  let result = [];

  while (parts.length > 0) {
    path = parts.shift();
    const node = path.node;
    if (t.CallExpression.check(node)) {
      parts.push(path.get('callee'));
      continue;
    } else if (t.MemberExpression.check(node)) {
      parts.push(path.get('object'));
      if (node.computed) {
        const resolvedPath = resolveToValue(path.get('property'));
        if (resolvedPath !== undefined) {
          result = result.concat(toArray(resolvedPath));
        } else {
          result.push('<computed>');
        }
      } else {
        result.push(node.property.name);
      }
      continue;
    } else if (t.Identifier.check(node)) {
      result.push(node.name);
      continue;
    } else if (t.Literal.check(node)) {
      result.push(node.raw);
      continue;
    } else if (t.ThisExpression.check(node)) {
      result.push('this');
      continue;
    } else if (t.ObjectExpression.check(node)) {
      const properties = path.get('properties').map(function(property) {
        return (
          toString(property.get('key')) + ': ' + toString(property.get('value'))
        );
      });
      result.push('{' + properties.join(', ') + '}');
      continue;
    } else if (t.ArrayExpression.check(node)) {
      result.push(
        '[' +
          path
            .get('elements')
            .map(toString)
            .join(', ') +
          ']',
      );
      continue;
    }
  }

  return result.reverse();
}

/**
 * Creates a string representation of a member expression.
 */
function toString(path: NodePath): string {
  return toArray(path).join('.');
}

export { toString as String, toArray as Array };
