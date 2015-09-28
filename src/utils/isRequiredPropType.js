import getMembers from '../utils/getMembers';

/**
 * Returns true of the prop is required, according to its type defintion
 */
export default function isRequiredPropType(path) {
  return getMembers(path).some(
    member => !member.computed && member.path.node.name === 'isRequired' ||
      member.computed && member.path.node.value === 'isRequired'
  );
}
