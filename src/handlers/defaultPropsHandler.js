/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import { namedTypes as t } from 'ast-types';
import getPropertyName from '../utils/getPropertyName';
import getMemberValuePath from '../utils/getMemberValuePath';
import printValue from '../utils/printValue';
import resolveToValue from '../utils/resolveToValue';
import resolveFunctionDefinitionToReturnValue from '../utils/resolveFunctionDefinitionToReturnValue';
import isReactComponentClass from '../utils/isReactComponentClass';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import type Documentation from '../Documentation';

function getDefaultValue(path: NodePath) {
  let node = path.node;
  let defaultValue;
  if (t.Literal.check(node)) {
    defaultValue = node.raw;
  } else {
    if (t.AssignmentPattern.check(path.node)) {
      path = resolveToValue(path.get('right'));
    } else {
      path = resolveToValue(path);
    }
    if (t.ImportDeclaration.check(path.node)) {
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
        t.CallExpression.check(node) ||
        t.MemberExpression.check(node) ||
        t.Identifier.check(node),
    };
  }

  return null;
}

function getStatelessPropsPath(componentDefinition): NodePath {
  const value = resolveToValue(componentDefinition);
  if (isReactForwardRefCall(value)) {
    const inner = resolveToValue(value.get('arguments', 0));
    return inner.get('params', 0);
  }
  return value.get('params', 0);
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

  if (t.FunctionExpression.check(defaultPropsPath.node)) {
    // Find the value that is returned from the function and process it if it is
    // an object literal.
    const returnValue = resolveFunctionDefinitionToReturnValue(
      defaultPropsPath,
    );
    if (returnValue && t.ObjectExpression.check(returnValue.node)) {
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
    // Don't evaluate property if component is functional and the node is not an AssignmentPattern
    .filter(
      propertyPath =>
        !isStateless ||
        t.AssignmentPattern.check(propertyPath.get('value').node),
    )
    .forEach(propertyPath => {
      if (t.Property.check(propertyPath.node)) {
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
      } else if (t.SpreadElement.check(propertyPath.node)) {
        const resolvedValuePath = resolveToValue(propertyPath.get('argument'));
        if (t.ObjectExpression.check(resolvedValuePath.node)) {
          getDefaultValuesFromProps(
            resolvedValuePath.get('properties'),
            documentation,
            isStateless,
          );
        }
      }
    });
}

export default function defaultPropsHandler(
  documentation: Documentation,
  componentDefinition: NodePath,
) {
  let statelessProps = null;
  const defaultPropsPath = getDefaultPropsPath(componentDefinition);
  /**
   * function, lazy, memo, forwardRef etc components can resolve default props as well
   */
  if (!isReactComponentClass(componentDefinition)) {
    statelessProps = getStatelessPropsPath(componentDefinition);
  }

  // Do both statelessProps and defaultProps if both are available so defaultProps can override
  if (statelessProps && t.ObjectPattern.check(statelessProps.node)) {
    getDefaultValuesFromProps(
      statelessProps.get('properties'),
      documentation,
      true,
    );
  }
  if (defaultPropsPath && t.ObjectExpression.check(defaultPropsPath.node)) {
    getDefaultValuesFromProps(
      defaultPropsPath.get('properties'),
      documentation,
      false,
    );
  }
}
