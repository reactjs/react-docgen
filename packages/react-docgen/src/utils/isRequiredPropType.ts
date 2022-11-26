import type { Node, NodePath } from '@babel/traverse';
import getMembers from '../utils/getMembers.js';

/**
 * Returns true of the prop is required, according to its type definition
 */
export default function isRequiredPropType(path: NodePath<Node>): boolean {
  return getMembers(path).some(
    ({ computed, path: memberPath }) =>
      (!computed &&
        memberPath.isIdentifier() &&
        memberPath.node.name === 'isRequired') ||
      (memberPath.isStringLiteral() && memberPath.node.value === 'isRequired'),
  );
}
