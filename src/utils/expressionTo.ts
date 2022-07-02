/*eslint no-loop-func: 0, no-use-before-define: 0*/

import { namedTypes as t } from 'ast-types';
import resolveToValue from './resolveToValue';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

/**
 * Splits a MemberExpression or CallExpression into parts.
 * E.g. foo.bar.baz becomes ['foo', 'bar', 'baz']
 */
function toArray(path: NodePath, importer: Importer): string[] {
  const parts = [path];
  let result: string[] = [];

  while (parts.length > 0) {
    path = parts.shift() as NodePath;
    const node = path.node;
    if (t.CallExpression.check(node)) {
      parts.push(path.get('callee'));
      continue;
    } else if (t.MemberExpression.check(node)) {
      parts.push(path.get('object'));
      if (node.computed) {
        const resolvedPath = resolveToValue(path.get('property'), importer);
        if (resolvedPath !== undefined) {
          result = result.concat(toArray(resolvedPath, importer));
        } else {
          result.push('<computed>');
        }
      } else {
        // @ts-ignore
        result.push(node.property.name);
      }
      continue;
    } else if (t.Identifier.check(node)) {
      result.push(node.name);
      continue;
    } else if (t.TSAsExpression.check(node)) {
      if (t.Identifier.check(node.expression)) {
        result.push(node.expression.name);
      }
      continue;
    } else if (t.Literal.check(node)) {
      // @ts-ignore
      result.push(node.raw);
      continue;
    } else if (t.FunctionExpression.check(node)) {
      result.push('<function>');
      continue;
    } else if (t.ThisExpression.check(node)) {
      result.push('this');
      continue;
    } else if (t.ObjectExpression.check(node)) {
      const properties = path.get('properties').map(function (property) {
        if (t.SpreadElement.check(property.node)) {
          return `...${toString(property.get('argument'), importer)}`;
        } else {
          return (
            toString(property.get('key'), importer) +
            ': ' +
            toString(property.get('value'), importer)
          );
        }
      });
      result.push('{' + properties.join(', ') + '}');
      continue;
    } else if (t.ArrayExpression.check(node)) {
      result.push(
        '[' +
          path
            .get('elements')
            .map(function (el) {
              return toString(el, importer);
            })
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
function toString(path: NodePath, importer: Importer): string {
  return toArray(path, importer).join('.');
}

export { toString as String, toArray as Array };
