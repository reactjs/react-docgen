import type { NodePath } from 'ast-types/lib/node-path';
import getMembers from '../utils/getMembers';

/**
 * Returns true of the prop is required, according to its type definition
 */
export default function isRequiredPropType(path: NodePath): boolean {
  return getMembers(path).some(
    member =>
      (!member.computed && member.path.node.name === 'isRequired') ||
      (member.computed && member.path.node.value === 'isRequired'),
  );
}
