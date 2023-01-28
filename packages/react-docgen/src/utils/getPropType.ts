/*eslint no-use-before-define: 0*/
import type { NodePath } from '@babel/traverse';
import { getDocblock } from '../utils/docblock.js';
import getMembers from './getMembers.js';
import getPropertyName from './getPropertyName.js';
import isRequiredPropType from '../utils/isRequiredPropType.js';
import printValue from './printValue.js';
import resolveToValue from './resolveToValue.js';
import resolveObjectKeysToArray from './resolveObjectKeysToArray.js';
import resolveObjectValuesToArray from './resolveObjectValuesToArray.js';
import type { PropTypeDescriptor, PropDescriptor } from '../Documentation.js';
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
    if (!elementPath.hasNode()) return;

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

function getPropTypeOneOf(argumentPath: NodePath): PropTypeDescriptor {
  const type: PropTypeDescriptor = { name: 'enum' };
  const value: NodePath = resolveToValue(argumentPath);

  if (!value.isArrayExpression()) {
    const objectValues =
      resolveObjectKeysToArray(value) || resolveObjectValuesToArray(value);

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
): name is (typeof simplePropTypes)[number] {
  return simplePropTypes.includes(name as (typeof simplePropTypes)[number]);
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
      }
      const propTypeHandler = propTypes.get(name);

      if (propTypeHandler && member.argumentPaths.length) {
        descriptor = propTypeHandler(member.argumentPaths[0]);

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
  }

  if (path.isCallExpression()) {
    const callee = path.get('callee');

    if (callee.isIdentifier()) {
      const propTypeHandler = propTypes.get(callee.node.name);

      if (propTypeHandler) {
        return propTypeHandler(path.get('arguments')[0]);
      }
    }
  }

  return { name: 'custom', raw: printValue(path) };
}
