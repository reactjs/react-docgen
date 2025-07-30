import type { NodePath } from '@babel/traverse';
import type { FunctionParameter, TSParameterProperty } from '@babel/types';
import printValue from './printValue.js';

type ParameterNodePath = NodePath<FunctionParameter | TSParameterProperty>;

export default function getParameterName(
  parameterPath: ParameterNodePath,
): string {
  if (parameterPath.isIdentifier()) {
    return parameterPath.node.name;
  } else if (parameterPath.isAssignmentPattern()) {
    return getParameterName(parameterPath.get('left') as ParameterNodePath);
  } else if (
    parameterPath.isObjectPattern() ||
    parameterPath.isArrayPattern()
  ) {
    return printValue(parameterPath);
  } else if (parameterPath.isRestElement()) {
    return `...${getParameterName(
      parameterPath.get('argument') as ParameterNodePath,
    )}`;
  } else if (parameterPath.isTSParameterProperty()) {
    return getParameterName(parameterPath.get('parameter'));
    // @ts-expect-error isVoidPattern is not yet in types
  } else if (parameterPath.isVoidPattern()) {
    return 'void';
  }

  throw new TypeError(
    'Parameter name must be one of Identifier, AssignmentPattern, ArrayPattern, ' +
      `ObjectPattern, RestElement, or VoidPattern instead got ${parameterPath.node.type}`,
  );
}
