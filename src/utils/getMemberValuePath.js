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

import getClassMemberValuePath from './getClassMemberValuePath';
import getPropertyValuePath from './getPropertyValuePath';
import recast from 'recast';

var {types: {namedTypes: types}} = recast;

var SYNONYMS = {
  getDefaultProps: 'defaultProps',
  defaultProps: 'getDefaultProps',
};

var LOOKUP_METHOD = {
  [types.ObjectExpression.name]: getPropertyValuePath,
  [types.ClassDeclaration.name]: getClassMemberValuePath,
  [types.ClassExpression.name]: getClassMemberValuePath,
};

function isSupportedDefinitionType({node}) {
  return types.ObjectExpression.check(node) ||
    types.ClassDeclaration.check(node) ||
    types.ClassExpression.check(node);
}

/**
 * This is a helper method for handlers to make it easier to work either with
 * an ObjectExpression from `React.createClass` class or with a class
 * definition.
 *
 * Given a path and a name, this function will either return the path of the
 * property value if the path is an ObjectExpression, or the value of the
 * ClassProperty/MethodDefinition if it is a class definition (declaration or
 * expression).
 *
 * It also normalizes the names so that e.g. `defaultProps` and
 * `getDefaultProps` can be used interchangeably.
 */
export default function getMemberValuePath(
  componentDefinition: NodePath,
  memberName: string
): ?NodePath {
  if (!isSupportedDefinitionType(componentDefinition)) {
    throw new TypeError(
      'Got unsupported definition type. Definition must either be an ' +
      'ObjectExpression, ClassDeclaration or ClassExpression. Got "' +
      componentDefinition.node.type + '" instead.'
    );
  }

  var lookupMethod = LOOKUP_METHOD[componentDefinition.node.type];
  var result = lookupMethod(componentDefinition, memberName);
  if (!result && SYNONYMS[memberName]) {
    return lookupMethod(componentDefinition, SYNONYMS[memberName]);
  }
  return result;
}
