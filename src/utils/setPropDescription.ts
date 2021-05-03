import type { NodePath } from 'ast-types/lib/node-path';
import type Documentation from '../Documentation';
import getPropertyName from './getPropertyName';
import { getDocblock } from './docblock';
import type { Importer } from '../parse';

export default function setPropDescription(
  documentation: Documentation,
  propertyPath: NodePath,
  importer: Importer,
): void {
  const propName = getPropertyName(propertyPath, importer);
  if (!propName) return;

  const propDescriptor = documentation.getPropDescriptor(propName);
  if (propDescriptor.description) return;

  propDescriptor.description = getDocblock(propertyPath) || '';
}
