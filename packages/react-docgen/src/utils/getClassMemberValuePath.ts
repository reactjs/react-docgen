import type { NodePath } from '@babel/traverse';
import type {
  ClassDeclaration,
  ClassExpression,
  ClassMethod,
  ClassProperty,
  Expression,
} from '@babel/types';
import getNameOrValue from './getNameOrValue.js';

export default function getClassMemberValuePath(
  classDefinition: NodePath<ClassDeclaration | ClassExpression>,
  memberName: string,
): NodePath<ClassMethod | Expression> | null {
  const classMember = classDefinition
    .get('body')
    .get('body')
    .find((memberPath) => {
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
    });

  if (classMember) {
    // For ClassProperty we return the value and for ClassMethod
    // we return itself
    return classMember.isClassMethod()
      ? classMember
      : (classMember.get('value') as NodePath<Expression>);
  }

  return null;
}
