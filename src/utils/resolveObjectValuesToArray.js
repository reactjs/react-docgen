/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import recast from 'recast';
import resolveToValue from './resolveToValue';

type ObjectPropMap = {
  properties: Array<string>,
  values: Object,
};

const {
  types: { ASTNode, NodePath, builders, namedTypes: types },
} = recast;

function isObjectValuesCall(node: ASTNode): boolean {
  return (
    types.CallExpression.check(node) &&
    node.arguments.length === 1 &&
    types.MemberExpression.check(node.callee) &&
    types.Identifier.check(node.callee.object) &&
    node.callee.object.name === 'Object' &&
    types.Identifier.check(node.callee.property) &&
    node.callee.property.name === 'values'
  );
}

function isWhitelistedObjectProperty(prop) {
  return (
    (types.Property.check(prop) &&
      ((types.Identifier.check(prop.key) && !prop.computed) ||
        types.Literal.check(prop.key))) ||
    types.SpreadElement.check(prop)
  );
}

function isWhiteListedObjectTypeProperty(prop) {
  return (
    types.ObjectTypeProperty.check(prop) ||
    types.ObjectTypeSpreadProperty.check(prop) ||
    types.TSPropertySignature.check(prop)
  );
}

// Resolves an ObjectExpression or an ObjectTypeAnnotation
export function resolveObjectToPropMap(
  object: NodePath,
  raw: boolean = false,
): ?ObjectPropMap {
  if (
    (types.ObjectExpression.check(object.value) &&
      object.value.properties.every(isWhitelistedObjectProperty)) ||
    (types.ObjectTypeAnnotation.check(object.value) &&
      object.value.properties.every(isWhiteListedObjectTypeProperty)) ||
    (types.TSTypeLiteral.check(object.value) &&
      object.value.members.every(isWhiteListedObjectTypeProperty))
  ) {
    const properties = [];
    let values = {};
    let error = false;
    const members = types.TSTypeLiteral.check(object.value)
      ? object.get('members')
      : object.get('properties');
    members.each(propPath => {
      if (error) return;
      const prop = propPath.value;

      if (prop.kind === 'get' || prop.kind === 'set') return;

      if (
        types.Property.check(prop) ||
        types.ObjectTypeProperty.check(prop) ||
        types.TSPropertySignature.check(prop)
      ) {
        // Key is either Identifier or Literal
        const name = prop.key.name || (raw ? prop.key.raw : prop.key.value);
        const propValue = propPath.get(name).parentPath.value;
        const value =
          propValue.value.value ||
          (raw ? propValue.value.raw : propValue.value.value);

        if (properties.indexOf(name) === -1) {
          properties.push(name);
        }
        values[name] = value;
      } else if (
        types.SpreadElement.check(prop) ||
        types.ObjectTypeSpreadProperty.check(prop)
      ) {
        let spreadObject = resolveToValue(propPath.get('argument'));
        if (types.GenericTypeAnnotation.check(spreadObject.value)) {
          const typeAlias = resolveToValue(spreadObject.get('id'));
          if (types.ObjectTypeAnnotation.check(typeAlias.get('right').value)) {
            spreadObject = resolveToValue(typeAlias.get('right'));
          }
        }

        const spreadValues = resolveObjectToPropMap(spreadObject);
        if (!spreadValues) {
          error = true;
          return;
        }
        spreadValues.properties.forEach(spreadProp => {
          if (properties.indexOf(spreadProp) === -1) {
            properties.push(spreadProp);
          }
        });
        values = { ...values, ...spreadValues.values };
      }
    });

    if (!error) {
      return { properties: properties.sort(), values };
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
 *  computed identifier values
 */
export default function resolveObjectValuesToArray(path: NodePath): ?NodePath {
  const node = path.node;

  if (isObjectValuesCall(node)) {
    const objectExpression = resolveToValue(path.get('arguments').get(0));
    const propMap = resolveObjectToPropMap(objectExpression);

    if (propMap) {
      const nodes = propMap.properties.map(prop => {
        const value = propMap.values[prop];

        return typeof value === 'undefined'
          ? builders.literal(null)
          : builders.literal(value);
      });

      return new NodePath(builders.arrayExpression(nodes));
    }
  }

  return null;
}
