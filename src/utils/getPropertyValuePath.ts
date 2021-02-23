import { namedTypes as t } from 'ast-types';
import getPropertyName from './getPropertyName';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

/**
 * Given an ObjectExpression, this function returns the path of the value of
 * the property with name `propertyName`.
 */
export default function getPropertyValuePath(
  path: NodePath,
  propertyName: string,
  importer: Importer,
): NodePath | null {
  t.ObjectExpression.assert(path.node);

  return path
    .get('properties')
    .filter(
      (propertyPath: NodePath) =>
        getPropertyName(propertyPath, importer) === propertyName,
    )
    .map((propertyPath: NodePath) => propertyPath.get('value'))[0];
}
