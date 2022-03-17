import { ASTNode, namedTypes as t } from 'ast-types';
import resolveToValue from './resolveToValue';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';
import { LiteralBuilder } from 'ast-types/gen/builders';

interface ObjectPropMap {
  properties: string[];
  values: Record<string, unknown>;
}

function isObjectValuesCall(node: ASTNode): boolean {
  return (
    t.CallExpression.check(node) &&
    node.arguments.length === 1 &&
    t.MemberExpression.check(node.callee) &&
    t.Identifier.check(node.callee.object) &&
    node.callee.object.name === 'Object' &&
    t.Identifier.check(node.callee.property) &&
    node.callee.property.name === 'values'
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
export function resolveObjectToPropMap(
  object: NodePath,
  importer: Importer,
  raw = false,
): ObjectPropMap | null {
  if (
    (t.ObjectExpression.check(object.value) &&
      object.value.properties.every(isWhitelistedObjectProperty)) ||
    (t.ObjectTypeAnnotation.check(object.value) &&
      object.value.properties.every(isWhiteListedObjectTypeProperty)) ||
    (t.TSTypeLiteral.check(object.value) &&
      object.value.members.every(isWhiteListedObjectTypeProperty))
  ) {
    const properties: string[] = [];
    let values = {};
    let error = false;
    const members = t.TSTypeLiteral.check(object.value)
      ? object.get('members')
      : object.get('properties');
    members.each(propPath => {
      if (error) return;
      const prop = propPath.value;

      if (prop.kind === 'get' || prop.kind === 'set') return;

      if (
        t.Property.check(prop) ||
        t.ObjectTypeProperty.check(prop) ||
        t.TSPropertySignature.check(prop)
      ) {
        // Key is either Identifier or Literal
        // @ts-ignore
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

        const spreadValues = resolveObjectToPropMap(spreadObject, importer);
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
 * Returns an ArrayExpression which contains all the values resolved from an object
 *
 * Ignores setters in objects
 *
 * Returns null in case of
 *  unresolvable spreads
 *  computed identifier values
 */
export default function resolveObjectValuesToArray(
  path: NodePath,
  importer: Importer,
): string[] | null {
  const node = path.node;

  if (isObjectValuesCall(node)) {
    const objectExpression = resolveToValue(
      path.get('arguments').get(0),
      importer,
    );
    const propMap = resolveObjectToPropMap(objectExpression, importer);

    if (propMap) {
      const nodes = propMap.properties.map(prop => {
        const value = propMap.values[prop] as Parameters<LiteralBuilder>[0];

        return typeof value === 'undefined'
          ? 'null'
          : typeof value === 'string'
          ? `"${value}"`
          : `${value}`;
      });

      return nodes;
    }
  }

  return null;
}
