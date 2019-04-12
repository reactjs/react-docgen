/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import recast from 'recast';

import getPropertyName from './getPropertyName';

const {
  types: { namedTypes: types },
} = recast;

const componentMethods = [
  'componentDidMount',
  'componentDidReceiveProps',
  'componentDidUpdate',
  'componentWillMount',
  'UNSAFE_componentWillMount',
  'componentWillReceiveProps',
  'UNSAFE_componentWillReceiveProps',
  'componentWillUnmount',
  'componentWillUpdate',
  'UNSAFE_componentWillUpdate',
  'getChildContext',
  'getDefaultProps',
  'getInitialState',
  'render',
  'shouldComponentUpdate',
  'getDerivedStateFromProps',
  'getDerivedStateFromError',
  'getSnapshotBeforeUpdate',
  'componentDidCatch',
];

/**
 * Returns if the method path is a Component method.
 */
export default function(methodPath: NodePath): boolean {
  if (
    !types.MethodDefinition.check(methodPath.node) &&
    !types.Property.check(methodPath.node)
  ) {
    return false;
  }

  const name = getPropertyName(methodPath);
  return componentMethods.indexOf(name) !== -1;
}
