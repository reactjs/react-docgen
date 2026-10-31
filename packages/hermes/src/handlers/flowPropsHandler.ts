import {
  getDescription,
  getParameterDefaults,
  isArrowFunctionExpression,
  isClassDeclaration,
  isClassExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isIdentifier,
  isLiteral,
  isObjectPattern,
  resolveComponentDefinition,
  type AstNode,
  type Handler,
} from '@react-docgen/core';
import getFlowType from '../utils/getFlowType.js';
import getPropsMembers from '../utils/getPropsMembers.js';
import { child, nodes } from '../utils/ast.js';

function annotationFor(node: AstNode): AstNode | null {
  const parameter =
    isFunctionDeclaration(node) ||
    isFunctionExpression(node) ||
    isArrowFunctionExpression(node)
      ? node.params[0]
      : null;

  if (parameter) {
    return child(
      child(parameter, 'typeAnnotation') ?? parameter,
      'typeAnnotation',
    );
  }

  if (isClassDeclaration(node) || isClassExpression(node)) {
    const superTypes = child(node, 'superTypeParameters');
    const params = superTypes ? nodes(superTypes, 'params') : [];

    return params[params.length === 3 ? 1 : 0] ?? null;
  }

  return null;
}

const flowPropsHandler: Handler = (documentation, path, file) => {
  const component = resolveComponentDefinition(file, path) ?? path;
  const parameter =
    isFunctionDeclaration(component.node) ||
    isFunctionExpression(component.node) ||
    isArrowFunctionExpression(component.node)
      ? component.node.params[0]
      : null;
  const annotation = annotationFor(component.node);
  const { composes, members, parameters } = getPropsMembers(file, annotation);
  const defaults = getParameterDefaults(
    parameter && isObjectPattern(parameter) ? parameter : null,
  );

  if (composes.length > 0) documentation.composes = [...new Set(composes)];
  if (members.length === 0) return;

  documentation.props ??= {};

  for (const member of members) {
    if (member.type !== 'ObjectTypeProperty') continue;
    const key = child(member, 'key');
    const value = child(member, 'value');

    if (!key || !isIdentifier(key) || !value) continue;
    const flowType = getFlowType(file, value, parameters);

    if (!flowType) continue;
    const defaultNode = defaults.get(key.name);

    documentation.props[key.name] = {
      ...documentation.props[key.name],
      description: getDescription(file, member),
      flowType,
      required: member.optional !== true,
      ...(defaultNode && isLiteral(defaultNode)
        ? {
            defaultValue: {
              computed: false,
              value:
                defaultNode.raw ??
                file.source.code.slice(
                  defaultNode.range[0],
                  defaultNode.range[1],
                ),
            },
          }
        : {}),
    };
  }
};

export default flowPropsHandler;
