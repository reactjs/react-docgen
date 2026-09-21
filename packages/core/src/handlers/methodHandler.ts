import {
  isArrowFunctionExpression,
  isClassDeclaration,
  isClassExpression,
  isIdentifier,
  isFunctionDeclaration,
  isFunctionExpression,
  isMethodDefinition,
  isPropertyDefinition,
  type AstNode,
  type Handler,
  type FileState,
  type TypeDescriptor,
} from '../internal.js';
import getDescription from '../utils/getDescription.js';
import getPropertyName from '../utils/getPropertyName.js';
import parseMethodDocblock from '../utils/parseMethodDocblock.js';
import findImperativeHandleMethods from '../utils/findImperativeHandleMethods.js';

function addImperativeMethods(
  documentation: Parameters<Handler>[0],
  path: Parameters<Handler>[1],
  file: Parameters<Handler>[2],
): void {
  if (
    !isFunctionDeclaration(path.node) &&
    !isFunctionExpression(path.node) &&
    !isArrowFunctionExpression(path.node)
  )
    return;
  for (const property of findImperativeHandleMethods(path.node)) {
    const name = getPropertyName(property.key);

    if (!name) continue;
    const description = getDescription(file, property);

    documentation.methods.push({
      name,
      docblock: description || null,
      modifiers: [],
      params: [],
      returns: null,
      ...(description ? { description } : {}),
    });
  }
}

export type TypeResolver = (
  file: FileState,
  annotation: AstNode,
) => TypeDescriptor | null;

export default function createMethodHandler(getType?: TypeResolver): Handler {
  return (documentation, path, file) => {
    addImperativeMethods(documentation, path, file);
    if (!isClassDeclaration(path.node) && !isClassExpression(path.node)) return;

    for (const member of path.node.body.body) {
      if (member.accessibility === 'private') continue;
      let name: string | null = null;
      let fn: AstNode | null = null;
      const modifiers: string[] = [];

      if (isMethodDefinition(member)) {
        name = getPropertyName(member.key);
        fn = member.value;
        if (member.static) modifiers.push('static');
        if (member.kind === 'get' || member.kind === 'set') {
          modifiers.push(member.kind);
        }
        if (member.value.async) modifiers.push('async');
        if (member.value.generator) modifiers.push('generator');
      } else if (
        isPropertyDefinition(member) &&
        member.value &&
        isArrowFunctionExpression(member.value)
      ) {
        name = getPropertyName(member.key);
        fn = member.value;
        if (member.static) modifiers.push('static');
        if (member.value.async) modifiers.push('async');
      }

      if (
        !name ||
        !fn ||
        name === 'constructor' ||
        name === 'render' ||
        name === 'UNSAFE_componentWillReceiveProps' ||
        name === 'componentDidMount' ||
        name === 'componentWillUnmount'
      )
        continue;

      const params = Array.isArray(fn.params) ? (fn.params as AstNode[]) : [];
      const returnType =
        fn.returnType &&
        typeof fn.returnType === 'object' &&
        'type' in fn.returnType
          ? (fn.returnType as AstNode)
          : null;
      const description = getDescription(file, member);
      const parsedDocblock = parseMethodDocblock(description);

      documentation.methods.push({
        name,
        docblock: description || null,
        modifiers,
        params: params.map((parameter) => {
          const annotation =
            parameter.typeAnnotation &&
            typeof parameter.typeAnnotation === 'object' &&
            'type' in parameter.typeAnnotation
              ? (parameter.typeAnnotation as AstNode)
              : null;
          const rawName = Array.isArray(parameter.range)
            ? file.source.code
                .slice(parameter.range[0], parameter.range[1])
                .replace(/\??:\s*[\s\S]*$/, '')
            : isIdentifier(parameter)
              ? parameter.name
              : '';
          const normalizedName = rawName
            .replace(/^\.\.\./, '')
            .replace(/\s*=.*$/, '');
          const documented =
            parameter.type === 'Identifier' ||
            parameter.type === 'AssignmentPattern'
              ? parsedDocblock.params.get(normalizedName)
              : undefined;
          const type =
            documented?.type ??
            (annotation && getType ? getType(file, annotation) : null);

          return {
            name: rawName.replace(/\s*=.*$/, ''),
            optional: Boolean(
              documented?.optional ||
              parameter.optional ||
              parameter.type === 'AssignmentPattern',
            ),
            ...(!description || documented || parameter.type === 'Identifier'
              ? { type }
              : {}),
            ...(documented?.description
              ? { description: documented.description }
              : {}),
          };
        }),
        returns:
          parsedDocblock.returns ??
          (returnType && getType ? { type: getType(file, returnType) } : null),
        ...(parsedDocblock.description
          ? { description: parsedDocblock.description }
          : {}),
      });
    }
  };
}
