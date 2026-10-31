import {
  isObjectExpression,
  isProperty,
  isSpreadElement,
  type FileState,
  type AstNode,
  type Property,
} from '../internal.js';
import resolveValue from './resolveValue.js';

export default function getObjectProperties(
  file: FileState,
  node: AstNode,
): Property[] {
  const object = resolveValue(file, node);

  if (!object || !isObjectExpression(object)) return [];

  return object.properties.flatMap((property) => {
    if (isProperty(property)) return [property];
    if (isSpreadElement(property)) {
      return getObjectProperties(file, property.argument);
    }

    return [];
  });
}
