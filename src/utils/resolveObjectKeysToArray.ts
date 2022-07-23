import resolveToValue from './resolveToValue';
import type { NodePath } from '@babel/traverse';
import type {
  CallExpression,
  Identifier,
  NumericLiteral,
  StringLiteral,
} from '@babel/types';

function isObjectKeysCall(path: NodePath): path is NodePath<CallExpression> {
  if (!path.isCallExpression() || path.get('arguments').length !== 1) {
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
    property.node.name === 'keys'
  );
}

function isWhitelistedObjectProperty(path: NodePath): boolean {
  if (path.isSpreadElement()) return true;

  if (
    path.isObjectProperty() ||
    (path.isObjectMethod() &&
      (path.node.kind === 'get' || path.node.kind === 'set'))
  ) {
    const key = path.get('key') as NodePath;
    return (
      (key.isIdentifier() && !path.node.computed) ||
      key.isStringLiteral() ||
      key.isNumericLiteral()
    );
  }

  return false;
}

function isWhiteListedObjectTypeProperty(path: NodePath): boolean {
  return (
    path.isObjectTypeProperty() ||
    path.isObjectTypeSpreadProperty() ||
    path.isTSPropertySignature()
  );
}

// Resolves an ObjectExpression or an ObjectTypeAnnotation
export function resolveObjectToNameArray(
  objectPath: NodePath,
  raw = false,
): string[] | null {
  if (
    (objectPath.isObjectExpression() &&
      objectPath.get('properties').every(isWhitelistedObjectProperty)) ||
    (objectPath.isObjectTypeAnnotation() &&
      objectPath.get('properties').every(isWhiteListedObjectTypeProperty)) ||
    (objectPath.isTSTypeLiteral() &&
      objectPath.get('members').every(isWhiteListedObjectTypeProperty))
  ) {
    let values: string[] = [];
    let error = false;
    const properties = objectPath.isTSTypeLiteral()
      ? objectPath.get('members')
      : (objectPath.get('properties') as NodePath[]);
    properties.forEach(propPath => {
      if (error) return;

      if (
        propPath.isObjectProperty() ||
        propPath.isObjectMethod() ||
        propPath.isObjectTypeProperty() ||
        propPath.isTSPropertySignature()
      ) {
        const key = propPath.get('key') as
          | NodePath<Identifier>
          | NodePath<NumericLiteral>
          | NodePath<StringLiteral>;
        // Key is either Identifier or Literal
        const name: string = key.isIdentifier()
          ? key.node.name
          : raw
          ? (key.node.extra?.raw as string)
          : `${key.node.value}`;

        values.push(name);
      } else if (
        propPath.isSpreadElement() ||
        propPath.isObjectTypeSpreadProperty()
      ) {
        let spreadObject = resolveToValue(propPath.get('argument') as NodePath);
        if (spreadObject.isGenericTypeAnnotation()) {
          const typeAliasRight = resolveToValue(spreadObject.get('id')).get(
            'right',
          ) as NodePath;
          if (typeAliasRight.isObjectTypeAnnotation()) {
            spreadObject = resolveToValue(typeAliasRight);
          }
        }

        const spreadValues = resolveObjectToNameArray(spreadObject);
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
): string[] | null {
  if (isObjectKeysCall(path)) {
    const objectExpression = resolveToValue(path.get('arguments')[0]);
    const values = resolveObjectToNameArray(objectExpression);

    if (values) {
      const nodes = values
        //filter duplicates
        .filter((value, index, array) => array.indexOf(value) === index)
        .map(value => `"${value}"`);

      return nodes;
    }
  }

  return null;
}
