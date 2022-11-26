import type { NodePath } from '@babel/traverse';
import type {
  ArrayPattern,
  AssignmentPattern,
  Identifier,
  ObjectPattern,
  RestElement,
  TSParameterProperty,
} from '@babel/types';
import printValue from './printValue.js';

type ParameterNodePath = NodePath<
  | ArrayPattern
  | AssignmentPattern
  | Identifier
  | ObjectPattern
  | RestElement
  | TSParameterProperty
>;

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
  }

  throw new TypeError(
    'Parameter name must be one of Identifier, AssignmentPattern, ArrayPattern, ' +
      `ObjectPattern or RestElement, instead got ${parameterPath.node.type}`,
  );
}
