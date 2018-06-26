/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 */

/*eslint no-use-before-define: 0*/

import { getDocblock } from '../utils/docblock';
import getMembers from './getMembers';
import getPropertyName from './getPropertyName';
import isRequiredPropType from '../utils/isRequiredPropType';
import printValue from './printValue';
import recast from 'recast';
import resolveToValue from './resolveToValue';
import resolveObjectKeysToArray from './resolveObjectKeysToArray';

const {
  types: { namedTypes: types },
} = recast;

function getEnumValues(path) {
  const values = [];

  path.get('elements').each(function(elementPath) {
    if (types.SpreadElement.check(elementPath.node)) {
      const value = resolveToValue(elementPath.get('argument'));

      if (types.ArrayExpression.check(value.node)) {
        // if the SpreadElement resolved to an Array, add all their elements too
        return values.push(...getEnumValues(value));
      } else {
        // otherwise we'll just print the SpreadElement itself
        return values.push({
          value: printValue(elementPath),
          computed: !types.Literal.check(elementPath.node),
        });
      }
    }

    // try to resolve the array element to it's value
    const value = resolveToValue(elementPath);
    return values.push({
      value: printValue(value),
      computed: !types.Literal.check(value.node),
    });
  });

  return values;
}

function getPropTypeOneOf(argumentPath) {
  const type: PropTypeDescriptor = { name: 'enum' };
  let value = resolveToValue(argumentPath);
  if (!types.ArrayExpression.check(value.node)) {
    value = resolveObjectKeysToArray(value);
    if (value) {
      type.value = getEnumValues(value);
    } else {
      // could not easily resolve to an Array, let's print the original value
      type.computed = true;
      type.value = printValue(argumentPath);
    }
  } else {
    type.value = getEnumValues(value);
  }
  return type;
}

function getPropTypeOneOfType(argumentPath) {
  const type: PropTypeDescriptor = { name: 'union' };
  if (!types.ArrayExpression.check(argumentPath.node)) {
    type.computed = true;
    type.value = printValue(argumentPath);
  } else {
    type.value = argumentPath.get('elements').map(getPropType);
  }
  return type;
}

function getPropTypeArrayOf(argumentPath) {
  const type: PropTypeDescriptor = { name: 'arrayOf' };
  const subType = getPropType(argumentPath);

  if (subType.name === 'unknown') {
    type.value = printValue(argumentPath);
    type.computed = true;
  } else {
    type.value = subType;
  }
  return type;
}

function getPropTypeObjectOf(argumentPath) {
  const type: PropTypeDescriptor = { name: 'objectOf' };
  const subType = getPropType(argumentPath);

  if (subType.name === 'unknown') {
    type.value = printValue(argumentPath);
    type.computed = true;
  } else {
    type.value = subType;
  }
  return type;
}

function getPropTypeShape(argumentPath) {
  const type: PropTypeDescriptor = { name: 'shape' };
  if (!types.ObjectExpression.check(argumentPath.node)) {
    argumentPath = resolveToValue(argumentPath);
  }

  if (types.ObjectExpression.check(argumentPath.node)) {
    const value = {};
    argumentPath.get('properties').each(function(propertyPath) {
      if (
        propertyPath.get('type').value === types.SpreadProperty.name || // bc for older estree version
        propertyPath.get('type').value === types.SpreadElement.name
      ) {
        // It is impossible to resolve a name for a spread element
        return;
      }

      const descriptor: PropDescriptor | PropTypeDescriptor = getPropType(
        propertyPath.get('value'),
      );
      const docs = getDocblock(propertyPath);
      if (docs) {
        descriptor.description = docs;
      }
      descriptor.required = isRequiredPropType(propertyPath.get('value'));
      value[getPropertyName(propertyPath)] = descriptor;
    });
    type.value = value;
  }

  if (!type.value) {
    type.value = printValue(argumentPath);
    type.computed = true;
  }

  return type;
}

function getPropTypeInstanceOf(argumentPath) {
  return {
    name: 'instanceOf',
    value: printValue(argumentPath),
  };
}

const simplePropTypes = {
  array: 1,
  bool: 1,
  func: 1,
  number: 1,
  object: 1,
  string: 1,
  any: 1,
  element: 1,
  node: 1,
  symbol: 1,
};

const propTypes = {
  oneOf: getPropTypeOneOf,
  oneOfType: getPropTypeOneOfType,
  instanceOf: getPropTypeInstanceOf,
  arrayOf: getPropTypeArrayOf,
  objectOf: getPropTypeObjectOf,
  shape: getPropTypeShape,
};

/**
 * Tries to identify the prop type by inspecting the path for known
 * prop type names. This method doesn't check whether the found type is actually
 * from React.PropTypes. It simply assumes that a match has the same meaning
 * as the React.PropTypes one.
 *
 * If there is no match, "custom" is returned.
 */
export default function getPropType(path: NodePath): PropTypeDescriptor {
  let descriptor;
  getMembers(path, true).some(member => {
    const node = member.path.node;
    let name;
    if (types.Literal.check(node)) {
      name = node.value;
    } else if (types.Identifier.check(node) && !member.computed) {
      name = node.name;
    }
    if (name) {
      if (simplePropTypes.hasOwnProperty(name)) {
        descriptor = { name };
        return true;
      } else if (propTypes.hasOwnProperty(name) && member.argumentsPath) {
        descriptor = propTypes[name](member.argumentsPath.get(0));
        return true;
      }
    }
  });
  if (!descriptor) {
    const node = path.node;
    if (
      types.Identifier.check(node) &&
      simplePropTypes.hasOwnProperty(node.name)
    ) {
      descriptor = { name: node.name };
    } else if (
      types.CallExpression.check(node) &&
      types.Identifier.check(node.callee) &&
      propTypes.hasOwnProperty(node.callee.name)
    ) {
      descriptor = propTypes[node.callee.name](path.get('arguments', 0));
    } else {
      descriptor = { name: 'custom', raw: printValue(path) };
    }
  }
  return descriptor;
}
