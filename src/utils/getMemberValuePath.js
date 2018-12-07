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
import getMemberExpressionValuePath from './getMemberExpressionValuePath';
import getPropertyValuePath from './getPropertyValuePath';
import resolveFunctionDefinitionToReturnValue from '../utils/resolveFunctionDefinitionToReturnValue';
import recast from 'recast';

const {
  types: { namedTypes: types },
} = recast;

const SYNONYMS = {
  getDefaultProps: 'defaultProps',
  defaultProps: 'getDefaultProps',
};

const POSTPROCESS_MEMBERS = {
  propTypes: path =>
    types.Function.check(path.node)
      ? resolveFunctionDefinitionToReturnValue(path)
      : path,
};

const LOOKUP_METHOD = {
  [types.ArrowFunctionExpression.name]: getMemberExpressionValuePath,
  [types.CallExpression.name]: getMemberExpressionValuePath,
  [types.FunctionExpression.name]: getMemberExpressionValuePath,
  [types.FunctionDeclaration.name]: getMemberExpressionValuePath,
  [types.VariableDeclaration.name]: getMemberExpressionValuePath,
  [types.ObjectExpression.name]: getPropertyValuePath,
  [types.ClassDeclaration.name]: getClassMemberValuePath,
  [types.ClassExpression.name]: getClassMemberValuePath,
};

function isSupportedDefinitionType({ node }) {
  return (
    types.ObjectExpression.check(node) ||
    types.ClassDeclaration.check(node) ||
    types.ClassExpression.check(node) ||
    /**
     * Adds support for libraries such as
     * [styled components]{@link https://github.com/styled-components} that use
     * TaggedTemplateExpression's to generate components.
     *
     * While react-docgen's built-in resolvers do not support resolving
     * TaggedTemplateExpression definitiona, third-party resolvers (such as
     * https://github.com/Jmeyering/react-docgen-annotation-resolver) could be
     * used to add these definitions.
     */
    types.TaggedTemplateExpression.check(node) ||
    // potential stateless function component
    types.VariableDeclaration.check(node) ||
    types.ArrowFunctionExpression.check(node) ||
    types.FunctionDeclaration.check(node) ||
    types.FunctionExpression.check(node) ||
    types.CallExpression.check(node)
  );
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
  memberName: string,
): ?NodePath {
  if (!isSupportedDefinitionType(componentDefinition)) {
    throw new TypeError(
      'Got unsupported definition type. Definition must be one of ' +
        'ObjectExpression, ClassDeclaration, ClassExpression,' +
        'VariableDeclaration, ArrowFunctionExpression, FunctionExpression, ' +
        'TaggedTemplateExpression, FunctionDeclaration or CallExpression. Got "' +
        componentDefinition.node.type +
        '"' +
        'instead.',
    );
  }

  const lookupMethod =
    LOOKUP_METHOD[componentDefinition.node.type] ||
    getMemberExpressionValuePath;
  let result = lookupMethod(componentDefinition, memberName);
  if (!result && SYNONYMS[memberName]) {
    result = lookupMethod(componentDefinition, SYNONYMS[memberName]);
  }
  if (result && POSTPROCESS_MEMBERS[memberName]) {
    result = POSTPROCESS_MEMBERS[memberName](result);
  }

  return result;
}
