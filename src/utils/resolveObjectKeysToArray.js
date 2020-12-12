/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { ASTNode, NodePath, builders, namedTypes as t } from 'ast-types';
import resolveToValue from './resolveToValue';
import type { Importer } from '../types';

function isObjectKeysCall(node: ASTNode): boolean {
  return (
    t.CallExpression.check(node) &&
    node.arguments.length === 1 &&
    t.MemberExpression.check(node.callee) &&
    t.Identifier.check(node.callee.object) &&
    node.callee.object.name === 'Object' &&
    t.Identifier.check(node.callee.property) &&
    node.callee.property.name === 'keys'
  );
}

function isWhitelistedObjectProperty(prop) {
  return (
    (t.Property.check(prop) &&
      ((t.Identifier.check(prop.key) && !prop.computed) ||
        t.Literal.check(prop.key))) ||
    t.SpreadElement.check(prop)
  );
}

function isWhiteListedObjectTypeProperty(prop) {
  return (
    t.ObjectTypeProperty.check(prop) ||
    t.ObjectTypeSpreadProperty.check(prop) ||
    t.TSPropertySignature.check(prop)
  );
}

// Resolves an ObjectExpression or an ObjectTypeAnnotation
export function resolveObjectToNameArray(
  object: NodePath,
  importer: Importer,
  raw: boolean = false,
): ?Array<string> {
  if (
    (t.ObjectExpression.check(object.value) &&
      object.value.properties.every(isWhitelistedObjectProperty)) ||
    (t.ObjectTypeAnnotation.check(object.value) &&
      object.value.properties.every(isWhiteListedObjectTypeProperty)) ||
    (t.TSTypeLiteral.check(object.value) &&
      object.value.members.every(isWhiteListedObjectTypeProperty))
  ) {
    let values = [];
    let error = false;
    const properties = t.TSTypeLiteral.check(object.value)
      ? object.get('members')
      : object.get('properties');
    properties.each(propPath => {
      if (error) return;
      const prop = propPath.value;

      if (
        t.Property.check(prop) ||
        t.ObjectTypeProperty.check(prop) ||
        t.TSPropertySignature.check(prop)
      ) {
        // Key is either Identifier or Literal
        const name = prop.key.name || (raw ? prop.key.raw : prop.key.value);

        values.push(name);
      } else if (
        t.SpreadElement.check(prop) ||
        t.ObjectTypeSpreadProperty.check(prop)
      ) {
        let spreadObject = resolveToValue(propPath.get('argument'), importer);
        if (t.GenericTypeAnnotation.check(spreadObject.value)) {
          const typeAlias = resolveToValue(spreadObject.get('id'), importer);
          if (t.ObjectTypeAnnotation.check(typeAlias.get('right').value)) {
            spreadObject = resolveToValue(typeAlias.get('right'), importer);
          }
        }

        const spreadValues = resolveObjectToNameArray(spreadObject, importer);
        if (!spreadValues) {
          error = true;
          return;
        }
        values = [...values, ...spreadValues];
      }
    });

    if (!error) {
      return values;
    }
  }

  return null;
}

/**
 * Returns an ArrayExpression which contains all the keys resolved from an object
 *
 * Ignores setters in objects
 *
 * Returns null in case of
 *  unresolvable spreads
 *  computed identifier keys
 */
export default function resolveObjectKeysToArray(
  path: NodePath,
  importer: Importer,
): ?NodePath {
  const node = path.node;

  if (isObjectKeysCall(node)) {
    const objectExpression = resolveToValue(
      path.get('arguments').get(0),
      importer,
    );
    const values = resolveObjectToNameArray(objectExpression, importer);

    if (values) {
      const nodes = values
        .filter((value, index, array) => array.indexOf(value) === index)
        .map(value => builders.literal(value));

      return new NodePath(builders.arrayExpression(nodes));
    }
  }

  return null;
}
