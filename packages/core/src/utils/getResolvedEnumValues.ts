import {
  isCallExpression,
  isIdentifier,
  isLiteral,
  isMemberExpression,
  type AstNode,
  type FileState,
} from '../internal.js';
import getMemberName from './getMemberName.js';
import getObjectProperties from './getObjectProperties.js';
import getPropertyName from './getPropertyName.js';

export default function getResolvedEnumValues(
  file: FileState,
  node: AstNode,
): Array<{ computed: false; value: string }> | null {
  if (
    isMemberExpression(node) &&
    !node.computed &&
    isIdentifier(node.property, { name: 'isRequired' })
  ) {
    return getResolvedEnumValues(file, node.object);
  }
  if (
    !isCallExpression(node) ||
    getMemberName(node.callee)?.endsWith('.oneOf') !== true
  ) {
    return null;
  }
  const [argument] = node.arguments;

  if (!argument || !isCallExpression(argument)) return null;
  const operation = getMemberName(argument.callee);
  const [object] = argument.arguments;

  if (
    !object ||
    (operation !== 'Object.keys' && operation !== 'Object.values')
  ) {
    return null;
  }
  const properties = getObjectProperties(file, object);

  if (properties.length === 0) return null;
  if (operation === 'Object.keys') {
    return properties.flatMap((property) => {
      const name = getPropertyName(property.key);

      return name
        ? [{ computed: false as const, value: JSON.stringify(name) }]
        : [];
    });
  }

  return properties.map((property) => ({
    computed: false,
    value:
      isLiteral(property.value) &&
      (typeof property.value.value === 'string' ||
        typeof property.value.value === 'number')
        ? JSON.stringify(property.value.value)
        : 'null',
  }));
}
