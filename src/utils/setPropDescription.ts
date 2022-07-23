import type { NodePath } from '@babel/traverse';
import type Documentation from '../Documentation';
import getPropertyName from './getPropertyName';
import { getDocblock } from './docblock';
import type {
  ObjectMethod,
  ObjectProperty,
  ObjectTypeProperty,
  TSPropertySignature,
} from '@babel/types';

export default function setPropDescription(
  documentation: Documentation,
  propertyPath: NodePath<
    ObjectMethod | ObjectProperty | ObjectTypeProperty | TSPropertySignature
  >,
): void {
  const propName = getPropertyName(propertyPath);
  if (!propName) return;

  const propDescriptor = documentation.getPropDescriptor(propName);
  if (propDescriptor.description) return;

  propDescriptor.description = getDocblock(propertyPath) || '';
}
