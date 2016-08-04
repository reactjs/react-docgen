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

import type Documentation from '../Documentation';

import getPropertyName from '../utils/getPropertyName';
import getMemberValuePath from '../utils/getMemberValuePath';
import printValue from '../utils/printValue';
import recast from 'recast';
import resolveToValue from '../utils/resolveToValue';
import isStatelessComponent from '../utils/isStatelessComponent';

var {types: {namedTypes: types, visit}} = recast;

function getDefaultValue(path: NodePath) {
  var node = path.node;
  var defaultValue;
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
      computed: types.CallExpression.check(node) ||
                types.MemberExpression.check(node) ||
                types.Identifier.check(node),
    };
  }
}

function getStatelessPropsPath(componentDefinition): NodePath {
  return resolveToValue(componentDefinition).get('params', 0);
}

function getDefaultPropsPath(componentDefinition: NodePath): ?NodePath {
  var defaultPropsPath = getMemberValuePath(
    componentDefinition,
    'defaultProps'
  );
  if (!defaultPropsPath) {
    return;
  }

  defaultPropsPath = resolveToValue(defaultPropsPath);
  if (!defaultPropsPath) {
    return;
  }

  if (types.FunctionExpression.check(defaultPropsPath.node)) {
    // Find the value that is returned from the function and process it if it is
    // an object literal.
    visit(defaultPropsPath.get('body'), {
      visitFunction: () => false,
      visitReturnStatement: function(path) {
        var resolvedPath = resolveToValue(path.get('argument'));
        if (types.ObjectExpression.check(resolvedPath.node)) {
          defaultPropsPath = resolvedPath;
        }
        return false;
      },
    });
  }
  return defaultPropsPath;
}

function getDefaultValuesFromProps(
  properties: NodePath,
  documentation: Documentation
) {
  properties
    .filter(propertyPath => types.Property.check(propertyPath.node))
    .forEach(function(propertyPath) {
      var propDescriptor = documentation.getPropDescriptor(
        getPropertyName(propertyPath)
      );
      var defaultValue = getDefaultValue(propertyPath.get('value'));
      if (defaultValue) {
        propDescriptor.defaultValue = defaultValue;
      }
    });
}

export default function defaultPropsHandler(
  documentation: Documentation,
  componentDefinition: NodePath
) {

  var statelessProps = null;
  var defaultPropsPath = getDefaultPropsPath(componentDefinition);
  if (isStatelessComponent(componentDefinition)) {
    statelessProps = getStatelessPropsPath(componentDefinition);
  }

  if (statelessProps && types.ObjectPattern.check(statelessProps.node)) {
    getDefaultValuesFromProps(statelessProps.get('properties'), documentation);
  }
  if (defaultPropsPath && types.ObjectExpression.check(defaultPropsPath.node)) {
    getDefaultValuesFromProps(defaultPropsPath.get('properties'), documentation);
  }
}
