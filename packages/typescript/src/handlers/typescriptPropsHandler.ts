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
  isTSPropertySignature,
  isTSTypeAnnotation,
  type Handler,
} from '@react-docgen/core';
import getComposedTypeNames from '../utils/getComposedTypeNames.js';
import getClassPropsType from '../utils/getClassPropsType.js';
import getPropsMembers from '../utils/getPropsMembers.js';
import getTSType from '../utils/getTSType.js';

const typescriptPropsHandler: Handler = (documentation, path, file) => {
  const parameter =
    isFunctionDeclaration(path.node) ||
    isFunctionExpression(path.node) ||
    isArrowFunctionExpression(path.node)
      ? path.node.params[0]
      : undefined;
  const annotation = parameter
    ? (isIdentifier(parameter) || isObjectPattern(parameter)) &&
      parameter.typeAnnotation &&
      isTSTypeAnnotation(parameter.typeAnnotation)
      ? parameter.typeAnnotation.typeAnnotation
      : null
    : isClassDeclaration(path.node) || isClassExpression(path.node)
      ? getClassPropsType(file, path.node)
      : null;
  const propsMembers = getPropsMembers(file, annotation);
  const composes = getComposedTypeNames(file, annotation);
  const defaults = getParameterDefaults(
    parameter && isObjectPattern(parameter) ? parameter : null,
  );

  if (composes.length > 0) documentation.composes = composes;
  if (propsMembers.length === 0) return;

  documentation.props = {};

  for (const member of propsMembers) {
    if (!isTSPropertySignature(member) || !isIdentifier(member.key)) continue;
    const tsType = getTSType(file, member.typeAnnotation);

    if (!tsType) continue;
    const defaultNode = defaults.get(member.key.name);

    documentation.props[member.key.name] = {
      description: getDescription(file, member),
      required: !member.optional,
      tsType,
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

export default typescriptPropsHandler;
