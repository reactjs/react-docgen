import { namedTypes as t } from 'ast-types';
import type { NodePath } from 'ast-types/lib/node-path';
import printValue from './printValue';

export default function getParameterName(parameterPath: NodePath): string {
  switch (parameterPath.node.type) {
    // @ts-ignore
    case t.Identifier.name:
      return parameterPath.node.name;
    // @ts-ignore
    case t.AssignmentPattern.name:
      return getParameterName(parameterPath.get('left'));
    // @ts-ignore
    case t.ObjectPattern.name: // @ts-ignore
    case t.ArrayPattern.name:
      return printValue(parameterPath);
    // @ts-ignore
    case t.RestElement.name:
      return '...' + getParameterName(parameterPath.get('argument'));
    default:
      throw new TypeError(
        'Parameter name must be an Identifier, an AssignmentPattern an ' +
          `ObjectPattern or a RestElement, got ${parameterPath.node.type}`,
      );
  }
}
