import {
  isArrowFunctionExpression,
  isCallExpression,
  isObjectExpression,
  isProperty,
  type AstNode,
  type Property,
} from '../internal.js';
import getMemberName from './getMemberName.js';

export default function findImperativeHandleMethods(node: AstNode): Property[] {
  const methods: Property[] = [];

  function visit(current: AstNode): void {
    if (
      isCallExpression(current) &&
      getMemberName(current.callee)?.split('.').at(-1) === 'useImperativeHandle'
    ) {
      const factory = current.arguments[1];

      if (
        factory &&
        isArrowFunctionExpression(factory) &&
        isObjectExpression(factory.body)
      ) {
        methods.push(...factory.body.properties.filter(isProperty));
      }
    }

    for (const value of Object.values(current)) {
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === 'object' && 'type' in child) {
            visit(child as AstNode);
          }
        }
      } else if (value && typeof value === 'object' && 'type' in value) {
        visit(value as AstNode);
      }
    }
  }

  visit(node);

  return methods;
}
