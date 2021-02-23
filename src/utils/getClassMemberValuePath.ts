import type { NodePath } from 'ast-types/lib/node-path';
import { namedTypes as t } from 'ast-types';
import getNameOrValue from './getNameOrValue';

export default function getClassMemberValuePath(
  classDefinition: NodePath,
  memberName: string,
): NodePath | null {
  // Fortunately it seems like that all members of a class body, be it
  // ClassProperty or MethodDefinition, have the same structure: They have a
  // "key" and a "value"
  return classDefinition
    .get('body', 'body')
    .filter(
      (memberPath: NodePath) =>
        (!memberPath.node.computed || t.Literal.check(memberPath.node.key)) &&
        !t.PrivateName.check(memberPath.node.key) &&
        getNameOrValue(memberPath.get('key')) === memberName &&
        memberPath.node.kind !== 'set',
    )
    .map((memberPath: NodePath) => memberPath.get('value'))[0];
}
