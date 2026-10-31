import {
  isArrayExpression,
  isCallExpression,
  isIdentifier,
  isLiteral,
  isMemberExpression,
  isObjectExpression,
  isProperty,
  type AstNode,
  type TypeDescriptor,
} from '../internal.js';
import getMemberName from './getMemberName.js';

export interface PropTypeResult {
  required: boolean;
  type: TypeDescriptor;
}

type GetDescription = (node: AstNode) => string;
type GetSource = (node: AstNode) => string;

function getCalledPropType(
  node: AstNode,
  getDescription?: GetDescription,
  getSource?: GetSource,
): TypeDescriptor | null {
  if (!isCallExpression(node)) {
    return null;
  }

  const calleeName = getMemberName(node.callee);
  const [argument] = node.arguments;

  if (!calleeName || !argument) {
    return null;
  }

  const name = calleeName.split('.').at(-1);

  if (name === 'arrayOf' || name === 'objectOf') {
    const result = getPropType(argument, getDescription, getSource);

    return result ? { name, value: result.type } : null;
  }

  if (name === 'instanceOf') {
    return isIdentifier(argument) ? { name, value: argument.name } : null;
  }

  if (name === 'oneOf' && isArrayExpression(argument)) {
    return {
      name: 'enum',
      value: argument.elements.flatMap((element) =>
        element && isLiteral(element)
          ? [
              {
                computed: false,
                value: element.raw ?? JSON.stringify(element.value),
              },
            ]
          : [],
      ),
    };
  }

  if (name === 'oneOf') {
    return {
      name: 'enum',
      computed: true,
      value: getSource?.(argument) ?? '',
    };
  }

  if (name === 'oneOfType' && isArrayExpression(argument)) {
    return {
      name: 'union',
      value: argument.elements.flatMap((element) => {
        const result = element
          ? getPropType(element, getDescription, getSource)
          : null;

        if (!result || !element) {
          return [];
        }

        const description = getDescription?.(element);

        return [
          {
            ...result.type,
            ...(description ? { description } : {}),
          },
        ];
      }),
    };
  }

  if ((name === 'shape' || name === 'exact') && isObjectExpression(argument)) {
    const value: Record<string, TypeDescriptor & { required: boolean }> = {};

    for (const property of argument.properties) {
      if (!isProperty(property) || !isIdentifier(property.key)) {
        continue;
      }

      const result = getPropType(property.value, getDescription, getSource);

      if (result) {
        const description = getDescription?.(property);

        value[property.key.name] = {
          ...result.type,
          ...(description ? { description } : {}),
          required: result.required,
        };
      }
    }

    return { name, value };
  }

  if (name === 'shape' || name === 'exact') {
    return {
      name,
      computed: true,
      value: getSource?.(argument) ?? '',
    };
  }

  return null;
}

export default function getPropType(
  node: AstNode,
  getDescription?: GetDescription,
  getSource?: GetSource,
): PropTypeResult | null {
  let required = false;

  if (
    isMemberExpression(node) &&
    !node.computed &&
    isIdentifier(node.property, { name: 'isRequired' })
  ) {
    required = true;
    node = node.object;
  }

  const calledType = getCalledPropType(node, getDescription, getSource);

  if (calledType) {
    return { required, type: calledType };
  }

  const name = getMemberName(node);

  if (!name?.includes('.')) {
    return null;
  }

  return {
    required,
    type: { name: name.split('.').at(-1) ?? name },
  };
}
