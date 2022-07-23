import type { NodePath } from '@babel/traverse';
import type { Expression, ObjectExpression, ObjectMethod } from '@babel/types';
import getPropertyName from './getPropertyName';

/**
 * Given an ObjectExpression, this function returns the path of the value of
 * the property with name `propertyName`.
 */
export default function getPropertyValuePath(
  path: NodePath<ObjectExpression>,
  propertyName: string,
): NodePath<Expression | ObjectMethod> | null {
  path.assertObjectExpression();

  return (
    path
      .get('properties')
      .filter(propertyPath => getPropertyName(propertyPath) === propertyName)
      .map(propertyPath =>
        propertyPath.isObjectMethod()
          ? propertyPath
          : propertyPath.isObjectProperty()
          ? (propertyPath.get('value') as NodePath<Expression>)
          : null,
      )[0] || null
  );
}
