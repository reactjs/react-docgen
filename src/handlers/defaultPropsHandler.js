/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Documentation from '../Documentation';

import getPropertyName from '../utils/getPropertyName';
import getMemberValuePath from '../utils/getMemberValuePath';
import printValue from '../utils/printValue';
import recast from 'recast';
import resolveToValue from '../utils/resolveToValue';
import resolveFunctionDefinitionToReturnValue from '../utils/resolveFunctionDefinitionToReturnValue';
import isStatelessComponent from '../utils/isStatelessComponent';

const {
  types: { namedTypes: types },
} = recast;

function getDefaultValue(path: NodePath) {
  let node = path.node;
  let defaultValue;
  if (types.Literal.check(node)) {
    defaultValue = node.raw;
  } else {
    if (types.AssignmentPattern.check(path.node)) {
      path = resolveToValue(path.get('right'));
    } else {
      path = resolveToValue(path);
    }
    if (types.ImportDeclaration.check(path.node)) {
      defaultValue = node.name;
    } else {
      node = path.node;
      defaultValue = printValue(path);
    }
  }
  if (typeof defaultValue !== 'undefined') {
    return {
      value: defaultValue,
      computed:
        types.CallExpression.check(node) ||
        types.MemberExpression.check(node) ||
        types.Identifier.check(node),
    };
  }

  return null;
}

function getStatelessPropsPath(componentDefinition): NodePath {
  return resolveToValue(componentDefinition).get('params', 0);
}

function getDefaultPropsPath(componentDefinition: NodePath): ?NodePath {
  let defaultPropsPath = getMemberValuePath(
    componentDefinition,
    'defaultProps',
  );
  if (!defaultPropsPath) {
    return null;
  }

  defaultPropsPath = resolveToValue(defaultPropsPath);
  if (!defaultPropsPath) {
    return null;
  }

  if (types.FunctionExpression.check(defaultPropsPath.node)) {
    // Find the value that is returned from the function and process it if it is
    // an object literal.
    const returnValue = resolveFunctionDefinitionToReturnValue(
      defaultPropsPath,
    );
    if (returnValue && types.ObjectExpression.check(returnValue.node)) {
      defaultPropsPath = returnValue;
    }
  }
  return defaultPropsPath;
}

function getDefaultValuesFromProps(
  properties: NodePath,
  documentation: Documentation,
  isStateless: boolean,
) {
  properties
    .filter(propertyPath => types.Property.check(propertyPath.node))
    // Don't evaluate property if component is functional and the node is not an AssignmentPattern
    .filter(
      propertyPath =>
        !isStateless ||
        types.AssignmentPattern.check(propertyPath.get('value').node),
    )
    .forEach(propertyPath => {
      const propName = getPropertyName(propertyPath);
      if (!propName) return;

      const propDescriptor = documentation.getPropDescriptor(propName);
      const defaultValue = getDefaultValue(
        isStateless
          ? propertyPath.get('value', 'right')
          : propertyPath.get('value'),
      );
      if (defaultValue) {
        propDescriptor.defaultValue = defaultValue;
      }
    });
}

export default function defaultPropsHandler(
  documentation: Documentation,
  componentDefinition: NodePath,
) {
  let statelessProps = null;
  const defaultPropsPath = getDefaultPropsPath(componentDefinition);
  if (isStatelessComponent(componentDefinition)) {
    statelessProps = getStatelessPropsPath(componentDefinition);
  }

  // Do both statelessProps and defaultProps if both are available so defaultProps can override
  if (statelessProps && types.ObjectPattern.check(statelessProps.node)) {
    getDefaultValuesFromProps(
      statelessProps.get('properties'),
      documentation,
      true,
    );
  }
  if (defaultPropsPath && types.ObjectExpression.check(defaultPropsPath.node)) {
    getDefaultValuesFromProps(
      defaultPropsPath.get('properties'),
      documentation,
      false,
    );
  }
}
