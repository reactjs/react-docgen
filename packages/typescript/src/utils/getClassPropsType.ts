import {
  getBody,
  getPropertyName,
  getValueFile,
  isAstNode,
  isCallExpression,
  isIdentifier,
  isLiteral,
  isMemberExpression,
  isPropertyDefinition,
  isTSTypeAnnotation,
  resolveValue,
  type AstNode,
  type ClassDeclaration,
  type ClassExpression,
  type FileState,
} from '@react-docgen/core';

function isReactComponentBase(file: FileState, node: AstNode): boolean {
  const expression = resolveValue(file, node);
  const member = isMemberExpression(expression) ? expression : null;

  if (
    member &&
    (member.computed ||
      (!isIdentifier(member.property, { name: 'Component' }) &&
        !isIdentifier(member.property, { name: 'PureComponent' })))
  ) {
    return false;
  }
  const local = member?.object ?? expression;

  if (!isIdentifier(local)) return false;

  for (const { node: declaration } of getBody(getValueFile(file, expression))) {
    if (
      declaration.type !== 'ImportDeclaration' ||
      !isAstNode(declaration.source) ||
      !isLiteral(declaration.source) ||
      declaration.source.value !== 'react' ||
      !Array.isArray(declaration.specifiers)
    ) {
      continue;
    }

    for (const specifier of declaration.specifiers) {
      if (
        !isAstNode(specifier) ||
        !isAstNode(specifier.local) ||
        !isIdentifier(specifier.local, { name: local.name })
      ) {
        continue;
      }
      if (member) {
        return (
          specifier.type === 'ImportDefaultSpecifier' ||
          specifier.type === 'ImportNamespaceSpecifier'
        );
      }

      return (
        specifier.type === 'ImportSpecifier' &&
        isAstNode(specifier.imported) &&
        (isIdentifier(specifier.imported, { name: 'Component' }) ||
          isIdentifier(specifier.imported, { name: 'PureComponent' }))
      );
    }
  }

  return false;
}

export default function getClassPropsType(
  file: FileState,
  definition: ClassDeclaration | ClassExpression,
): AstNode | null {
  const [propsType] = definition.superTypeArguments?.params ?? [];

  if (propsType) return propsType;
  const superClass = definition.superClass;

  if (isAstNode(superClass) && isCallExpression(superClass)) {
    const [base] = superClass.arguments;

    if (
      base?.type === 'TSInstantiationExpression' &&
      isAstNode(base.expression) &&
      isReactComponentBase(file, base.expression)
    ) {
      const argumentsNode = base.typeArguments ?? base.typeParameters;

      if (
        isAstNode(argumentsNode) &&
        Array.isArray(argumentsNode.params) &&
        isAstNode(argumentsNode.params[0])
      ) {
        return argumentsNode.params[0];
      }
    }
  }

  const props = definition.body.body.find(
    (member) =>
      isPropertyDefinition(member) &&
      !member.static &&
      !member.computed &&
      getPropertyName(member.key) === 'props',
  );
  const annotation = props?.typeAnnotation;

  return isAstNode(annotation) && isTSTypeAnnotation(annotation)
    ? annotation.typeAnnotation
    : null;
}
