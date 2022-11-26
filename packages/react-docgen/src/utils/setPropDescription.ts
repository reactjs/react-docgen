import type { NodePath } from '@babel/traverse';
import type Documentation from '../Documentation.js';
import getPropertyName from './getPropertyName.js';
import { getDocblock } from './docblock.js';
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
