import { namedTypes as t } from 'ast-types';
import getPropertyName from './getPropertyName';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

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
export default function (methodPath: NodePath, importer: Importer): boolean {
  if (
    !t.MethodDefinition.check(methodPath.node) &&
    !t.Property.check(methodPath.node)
  ) {
    return false;
  }

  const name = getPropertyName(methodPath, importer);
  return !!name && componentMethods.indexOf(name) !== -1;
}
