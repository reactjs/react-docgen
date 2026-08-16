import {
  isAssignmentPattern,
  isExportNamedDeclaration,
  isFunctionDeclaration,
  isIdentifier,
  isLiteral,
  isObjectPattern,
  isProgram,
  isProperty,
  isTSBooleanKeyword,
  isTSPropertySignature,
  isTSStringKeyword,
  isTSTypeAliasDeclaration,
  isTSTypeAnnotation,
  isTSTypeLiteral,
  isTSTypeReference,
  type AstNode,
  type AstPath,
  type Comment,
  type FileState,
  type Handler,
  type ObjectPattern,
  type Resolver,
  type TSTypeLiteral,
} from '@react-docgen/core';

function getBody(file: FileState): AstPath[] {
  const body = file.path.get('body');

  return Array.isArray(body) ? body : [];
}

export const resolver: Resolver = (file) =>
  getBody(file).flatMap((path) => {
    if (!isExportNamedDeclaration(path.node) || !path.node.declaration) {
      return [];
    }

    const declaration = path.get('declaration');

    return declaration &&
      !Array.isArray(declaration) &&
      isFunctionDeclaration(declaration.node)
      ? [declaration]
      : [];
  });

function getDescription(file: FileState, node: AstNode): string {
  if (!isProgram(file.ast) || !('range' in node)) {
    return '';
  }

  const start = (node.range as readonly [number, number])[0];
  const comments = (file.ast.comments ?? []).filter(
    (comment): comment is Comment =>
      comment.type === 'Block' &&
      comment.value.startsWith('*') &&
      comment.range[1] <= start &&
      /^[\s,;]*$/.test(file.source.code.slice(comment.range[1], start)),
  );
  const comment = comments.at(-1);

  return comment
    ? comment.value
        .split('\n')
        .map((line) => line.replace(/^\s*\* ?/, ''))
        .join('\n')
        .trim()
    : '';
}

function getPropsType(
  file: FileState,
  parameter: AstNode,
): TSTypeLiteral | null {
  const annotation =
    (isIdentifier(parameter) || isObjectPattern(parameter)) &&
    parameter.typeAnnotation &&
    isTSTypeAnnotation(parameter.typeAnnotation)
      ? parameter.typeAnnotation.typeAnnotation
      : null;

  if (!annotation) {
    return null;
  }

  if (isTSTypeLiteral(annotation)) {
    return annotation;
  }

  if (!isTSTypeReference(annotation) || !isIdentifier(annotation.typeName)) {
    return null;
  }

  for (const path of getBody(file)) {
    if (
      isTSTypeAliasDeclaration(path.node) &&
      path.node.id.name === annotation.typeName.name &&
      isTSTypeLiteral(path.node.typeAnnotation)
    ) {
      return path.node.typeAnnotation;
    }
  }

  return null;
}

function getDefaults(pattern: ObjectPattern | null): Map<string, AstNode> {
  const defaults = new Map<string, AstNode>();

  for (const property of pattern?.properties ?? []) {
    if (
      isProperty(property) &&
      isIdentifier(property.key) &&
      isAssignmentPattern(property.value)
    ) {
      defaults.set(property.key.name, property.value.right);
    }
  }

  return defaults;
}

function getTypeName(node: AstNode | undefined): string | null {
  if (!node || !isTSTypeAnnotation(node)) {
    return null;
  }

  if (isTSStringKeyword(node.typeAnnotation)) {
    return 'string';
  }

  if (isTSBooleanKeyword(node.typeAnnotation)) {
    return 'boolean';
  }

  return null;
}

export const handler: Handler = (documentation, path, file) => {
  if (!isFunctionDeclaration(path.node) || !path.node.id) {
    return;
  }

  const parameter = path.node.params[0];
  const propsType = parameter ? getPropsType(file, parameter) : null;
  const pattern = parameter && isObjectPattern(parameter) ? parameter : null;
  const defaults = getDefaults(pattern);

  documentation.displayName = path.node.id.name;
  documentation.description = getDescription(
    file,
    path.parentPath?.node ?? path.node,
  );

  if (!propsType) {
    return;
  }

  documentation.props = {};

  for (const member of propsType.members) {
    if (!isTSPropertySignature(member) || !isIdentifier(member.key)) {
      continue;
    }

    const typeName = getTypeName(member.typeAnnotation);

    if (!typeName) {
      continue;
    }

    const defaultNode = defaults.get(member.key.name);

    documentation.props[member.key.name] = {
      description: getDescription(file, member),
      required: !member.optional,
      tsType: { name: typeName },
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
