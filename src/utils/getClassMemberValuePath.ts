import type { NodePath } from '@babel/traverse';
import type {
  ClassDeclaration,
  ClassExpression,
  ClassMethod,
  ClassProperty,
  Expression,
} from '@babel/types';
import getNameOrValue from './getNameOrValue';

export default function getClassMemberValuePath(
  classDefinition: NodePath<ClassDeclaration | ClassExpression>,
  memberName: string,
): NodePath<ClassMethod | Expression> | null {
  // Fortunately it seems like that all members of a class body, be it
  // ClassProperty or ClassMethod, have the same structure: They have a
  // "key" and a "value"
  return (
    classDefinition
      .get('body')
      .get('body')
      .filter(memberPath => {
        if (
          (memberPath.isClassMethod() && memberPath.node.kind !== 'set') ||
          memberPath.isClassProperty()
        ) {
          const key = (memberPath as NodePath<ClassMethod | ClassProperty>).get(
            'key',
          );
          return (
            (!memberPath.node.computed || key.isLiteral()) &&
            getNameOrValue(key) === memberName
          );
        }

        return false;
      }) //TODO ClassMethod does not have value
      .map(memberPath =>
        memberPath.isClassMethod()
          ? memberPath
          : (memberPath.get('value') as NodePath<Expression>),
      )[0] || null
  );
}
