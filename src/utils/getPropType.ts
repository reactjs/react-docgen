/*eslint no-use-before-define: 0*/
import type { NodePath } from '@babel/traverse';
import { getDocblock } from '../utils/docblock';
import getMembers from './getMembers';
import getPropertyName from './getPropertyName';
import isRequiredPropType from '../utils/isRequiredPropType';
import printValue from './printValue';
import resolveToValue from './resolveToValue';
import resolveObjectKeysToArray from './resolveObjectKeysToArray';
import resolveObjectValuesToArray from './resolveObjectValuesToArray';
import type { PropTypeDescriptor, PropDescriptor } from '../Documentation';
import type {
  ArrayExpression,
  Expression,
  ObjectProperty,
  SpreadElement,
} from '@babel/types';

function getEnumValuesFromArrayExpression(
  path: NodePath<ArrayExpression>,
): Array<Record<string, unknown>> {
  const values: Array<Record<string, unknown>> = [];

  path.get('elements').forEach(elementPath => {
    // Array holes TODO test
    if (elementPath.node == null) return;

    if (elementPath.isSpreadElement()) {
      const value = resolveToValue(elementPath.get('argument'));

      if (value.isArrayExpression()) {
        // if the SpreadElement resolved to an Array, add all their elements too
        return values.push(...getEnumValuesFromArrayExpression(value));
      } else {
        // otherwise we'll just print the SpreadElement itself
        return values.push({
          value: printValue(elementPath),
          computed: !elementPath.isLiteral(),
        });
      }
    }

    // try to resolve the array element to it's value
    const value = resolveToValue(elementPath as NodePath<Expression>);
    return values.push({
      value: printValue(value),
      computed: !value.isLiteral(),
    });
  });

  return values;
}

// TODO
function getPropTypeOneOf(argumentPath: NodePath): PropTypeDescriptor {
  const type: PropTypeDescriptor = { name: 'enum' };
  const value: NodePath = resolveToValue(argumentPath);
  if (!value.isArrayExpression()) {
    const objectValues =
      resolveObjectKeysToArray(value) || //TODO return array of names and not ArrayExpression anymore
      resolveObjectValuesToArray(value);
    if (objectValues) {
      type.value = objectValues.map(objectValue => ({
        value: objectValue,
        computed: false,
      }));
    } else {
      // could not easily resolve to an Array, let's print the original value
      type.computed = true;
      type.value = printValue(argumentPath);
    }
  } else {
    type.value = getEnumValuesFromArrayExpression(value);
  }
  return type;
}

function getPropTypeOneOfType(argumentPath: NodePath): PropTypeDescriptor {
  const type: PropTypeDescriptor = { name: 'union' };
  if (!argumentPath.isArrayExpression()) {
    type.computed = true;
    type.value = printValue(argumentPath);
  } else {
    type.value = argumentPath.get('elements').map(elementPath => {
      // Array holes TODO test
      if (!elementPath.hasNode()) return;
      const descriptor: PropTypeDescriptor = getPropType(elementPath);
      const docs = getDocblock(
        elementPath as NodePath<Expression | SpreadElement>,
      );
      if (docs) {
        descriptor.description = docs;
      }
      return descriptor;
    });
  }
  return type;
}

function getPropTypeArrayOf(argumentPath: NodePath) {
  const type: PropTypeDescriptor = { name: 'arrayOf' };

  const docs = getDocblock(argumentPath);
  if (docs) {
    type.description = docs;
  }

  const subType = getPropType(argumentPath);

  // @ts-ignore
  if (subType.name === 'unknown') {
    type.value = printValue(argumentPath);
    type.computed = true;
  } else {
    type.value = subType;
  }
  return type;
}

function getPropTypeObjectOf(argumentPath: NodePath) {
  const type: PropTypeDescriptor = { name: 'objectOf' };

  const docs = getDocblock(argumentPath);
  if (docs) {
    type.description = docs;
  }

  const subType = getPropType(argumentPath);

  // @ts-ignore
  if (subType.name === 'unknown') {
    type.value = printValue(argumentPath);
    type.computed = true;
  } else {
    type.value = subType;
  }
  return type;
}

/**
 * Handles shape and exact prop types
 */
function getPropTypeShapish(name: 'exact' | 'shape', argumentPath: NodePath) {
  const type: PropTypeDescriptor = { name };
  if (!argumentPath.isObjectExpression()) {
    argumentPath = resolveToValue(argumentPath);
  }

  if (argumentPath.isObjectExpression()) {
    const value = {};
    argumentPath.get('properties').forEach(propertyPath => {
      if (propertyPath.isSpreadElement() || propertyPath.isObjectMethod()) {
        // It is impossible to resolve a name for a spread element
        return;
      }

      const propertyName = getPropertyName(propertyPath);
      if (!propertyName) return;

      const valuePath = (propertyPath as NodePath<ObjectProperty>).get('value');

      const descriptor: PropDescriptor | PropTypeDescriptor =
        getPropType(valuePath);
      const docs = getDocblock(propertyPath);
      if (docs) {
        descriptor.description = docs;
      }
      descriptor.required = isRequiredPropType(valuePath);
      value[propertyName] = descriptor;
    });
    type.value = value;
  }

  if (!type.value) {
    type.value = printValue(argumentPath);
    type.computed = true;
  }

  return type;
}

function getPropTypeInstanceOf(argumentPath: NodePath): PropTypeDescriptor {
  return {
    name: 'instanceOf',
    value: printValue(argumentPath),
  };
}

const simplePropTypes = [
  'array',
  'bool',
  'func',
  'number',
  'object',
  'string',
  'any',
  'element',
  'node',
  'symbol',
  'elementType',
] as const;

function isSimplePropType(
  name: string,
): name is typeof simplePropTypes[number] {
  return simplePropTypes.includes(name as typeof simplePropTypes[number]);
}

const propTypes = new Map<string, (path: NodePath) => PropTypeDescriptor>([
  ['oneOf', getPropTypeOneOf],
  ['oneOfType', getPropTypeOneOfType],
  ['instanceOf', getPropTypeInstanceOf],
  ['arrayOf', getPropTypeArrayOf],
  ['objectOf', getPropTypeObjectOf],
  ['shape', getPropTypeShapish.bind(null, 'shape')],
  ['exact', getPropTypeShapish.bind(null, 'exact')],
]);

/**
 * Tries to identify the prop type by inspecting the path for known
 * prop type names. This method doesn't check whether the found type is actually
 * from React.PropTypes. It simply assumes that a match has the same meaning
 * as the React.PropTypes one.
 *
 * If there is no match, "custom" is returned.
 */
export default function getPropType(path: NodePath): PropTypeDescriptor {
  let descriptor: PropTypeDescriptor | null = null;
  getMembers(path, true).some(member => {
    const memberPath = member.path;
    let name: string | null = null;
    if (memberPath.isStringLiteral()) {
      name = memberPath.node.value;
    } else if (memberPath.isIdentifier() && !member.computed) {
      name = memberPath.node.name;
    }
    if (name) {
      if (isSimplePropType(name)) {
        descriptor = { name };
        return true;
      } else if (propTypes.has(name) && member.argumentPaths.length) {
        descriptor = propTypes.get(name)!(member.argumentPaths[0]);
        return true;
      }
    }

    return;
  });

  if (descriptor) {
    return descriptor;
  }

  if (path.isIdentifier() && isSimplePropType(path.node.name)) {
    return { name: path.node.name };
  } else if (path.isCallExpression()) {
    const callee = path.get('callee');

    if (callee.isIdentifier() && propTypes.has(callee.node.name)) {
      return propTypes.get(callee.node.name)!(path.get('arguments')[0]);
    }
  }

  return { name: 'custom', raw: printValue(path) };
}
