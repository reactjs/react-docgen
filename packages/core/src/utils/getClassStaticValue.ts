import {
  isClassDeclaration,
  isClassExpression,
  isIdentifier,
  isBlockStatement,
  isMethodDefinition,
  isPropertyDefinition,
  isReturnStatement,
  type AstNode,
  type AstPath,
  type FileState,
} from '../internal.js';
import resolveValue from './resolveValue.js';

export default function getClassStaticValue(
  file: FileState,
  path: AstPath,
  name: string,
): AstNode | null {
  if (!isClassDeclaration(path.node) && !isClassExpression(path.node)) {
    return null;
  }

  for (const member of path.node.body.body) {
    if (
      isPropertyDefinition(member) &&
      member.static &&
      !member.computed &&
      isIdentifier(member.key, { name })
    ) {
      return member.value;
    }

    if (
      isMethodDefinition(member) &&
      member.static &&
      member.kind === 'get' &&
      !member.computed &&
      isIdentifier(member.key, { name }) &&
      isBlockStatement(member.value.body)
    ) {
      const returned = member.value.body.body.find(isReturnStatement)?.argument;

      return returned ? resolveValue(file, returned) : null;
    }
  }

  return null;
}
