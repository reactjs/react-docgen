import { namedTypes as t } from 'ast-types';
import type { NodePath } from 'ast-types/lib/node-path';

/**
 * Returns the path to the first part of the MemberExpression. I.e. given a
 * path representing
 *
 * foo.bar.baz
 *
 * it returns the path of/to `foo`.
 */
export default function getMemberExpressionRoot(
  memberExpressionPath: NodePath,
): NodePath {
  do {
    memberExpressionPath = memberExpressionPath.get('object');
  } while (t.MemberExpression.check(memberExpressionPath.node));
  return memberExpressionPath;
}
