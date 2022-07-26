import resolveToValue from './resolveToValue';
import type { NodePath } from '@babel/traverse';
import type {
  CallExpression,
  Identifier,
  NumericLiteral,
  ObjectMethod,
  ObjectProperty,
  ObjectTypeProperty,
  ObjectTypeSpreadProperty,
  SpreadElement,
  StringLiteral,
  TSPropertySignature,
} from '@babel/types';

interface ObjectPropMap {
  properties: string[];
  values: Record<string, unknown>;
}

function isObjectValuesCall(path: NodePath): path is NodePath<CallExpression> {
  if (!path.isCallExpression() || path.node.arguments.length !== 1) {
    return false;
  }

  const callee = path.get('callee');

  if (!callee.isMemberExpression()) {
    return false;
  }
  const object = callee.get('object');
  const property = callee.get('property');

  return (
    object.isIdentifier() &&
    object.node.name === 'Object' &&
    property.isIdentifier() &&
    property.node.name === 'values'
  );
}

function isWhitelistedObjectProperty(prop: NodePath): boolean {
  return (
    (prop.isObjectProperty() &&
      ((prop.get('key').isIdentifier() && !prop.node.computed) ||
        prop.get('key').isStringLiteral() ||
        prop.get('key').isNumericLiteral())) ||
    (prop.isObjectMethod() &&
      ((prop.get('key').isIdentifier() && !prop.node.computed) ||
        prop.get('key').isStringLiteral() ||
        prop.get('key').isNumericLiteral())) ||
    prop.isSpreadElement()
  );
}

function isWhiteListedObjectTypeProperty(prop: NodePath): boolean {
  return (
    prop.isObjectTypeProperty() ||
    prop.isObjectTypeSpreadProperty() ||
    prop.isTSPropertySignature()
  );
}

// Resolves an ObjectExpression or an ObjectTypeAnnotation
export function resolveObjectToPropMap(
  object: NodePath,
  raw = false,
): ObjectPropMap | null {
  if (
    (object.isObjectExpression() &&
      object.get('properties').every(isWhitelistedObjectProperty)) ||
    (object.isObjectTypeAnnotation() &&
      object.get('properties').every(isWhiteListedObjectTypeProperty)) ||
    (object.isTSTypeLiteral() &&
      object.get('members').every(isWhiteListedObjectTypeProperty))
  ) {
    const properties: string[] = [];
    let values = {};
    let error = false;
    const members: Array<
      NodePath<
        | ObjectMethod
        | ObjectProperty
        | ObjectTypeProperty
        | ObjectTypeSpreadProperty
        | SpreadElement
        | TSPropertySignature
      >
    > = object.isTSTypeLiteral()
      ? (object.get('members') as Array<NodePath<TSPropertySignature>>)
      : (object.get('properties') as Array<
          NodePath<
            | ObjectMethod
            | ObjectProperty
            | ObjectTypeProperty
            | ObjectTypeSpreadProperty
            | SpreadElement
          >
        >);

    members.forEach(propPath => {
      if (error || propPath.isObjectMethod()) return;

      if (
        propPath.isObjectProperty() ||
        propPath.isObjectTypeProperty() ||
        propPath.isTSPropertySignature()
      ) {
        const key = propPath.get('key') as NodePath<
          Identifier | NumericLiteral | StringLiteral
        >;
        // Key is either Identifier or Literal
        // TODO check this also for TSPropertySignature and ObjectTypeProperty
        // TODO reimplement, this has so many issues
        // Identifiers as values are not followed at all
        // TSPropertySignature is not handled correctly here
        const name: string = key.isIdentifier()
          ? key.node.name
          : raw
          ? (key.node.extra?.raw as string)
          : `${(key as NodePath<NumericLiteral | StringLiteral>).node.value}`;
        const value =
          // @ts-ignore
          propPath.node.value.value ||
          // @ts-ignore
          (raw ? propPath.node.value.raw : propPath.node.value.value);

        if (properties.indexOf(name) === -1) {
          properties.push(name);
        }
        values[name] = value;
      } else if (
        propPath.isSpreadElement() ||
        propPath.isObjectTypeSpreadProperty()
      ) {
        let spreadObject = resolveToValue(propPath.get('argument') as NodePath);

        if (spreadObject.isGenericTypeAnnotation()) {
          const typeAlias = resolveToValue(spreadObject.get('id'));

          if (
            typeAlias.isTypeAlias() &&
            typeAlias.get('right').isObjectTypeAnnotation()
          ) {
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
): string[] | null {
  if (isObjectValuesCall(path)) {
    const objectExpression = resolveToValue(path.get('arguments')[0]);
    const propMap = resolveObjectToPropMap(objectExpression);

    if (propMap) {
      const nodes = propMap.properties.map(prop => {
        const value = propMap.values[prop];

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
