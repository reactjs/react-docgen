import type { NodePath } from '@babel/traverse';
import type { Expression, ObjectExpression, ObjectMethod } from '@babel/types';
import getPropertyName from './getPropertyName';

/**
 * Given an ObjectExpression, this function returns the path of the value of
 * the property with name `propertyName`. if the property is an ObjectMethod we
 * return the ObjectMethod itself.
 */
export default function getPropertyValuePath(
  path: NodePath<ObjectExpression>,
  propertyName: string,
): NodePath<Expression | ObjectMethod> | null {
  const property = path
    .get('properties')
    .find(
      propertyPath =>
        !propertyPath.isSpreadElement() &&
        getPropertyName(propertyPath) === propertyName,
    );

  if (property) {
    return property.isObjectMethod()
      ? property
      : (property.get('value') as NodePath<Expression>);
  }
  return null;
}
