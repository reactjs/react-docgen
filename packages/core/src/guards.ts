import type { AstNode } from './AstNode.js';
import type {
  AssignmentPattern,
  ExportNamedDeclaration,
  FunctionDeclaration,
  Identifier,
  Literal,
  ObjectPattern,
  Program,
  Property,
  TSBooleanKeyword,
  TSPropertySignature,
  TSStringKeyword,
  TSTypeAliasDeclaration,
  TSTypeAnnotation,
  TSTypeLiteral,
  TSTypeReference,
} from './nodes.js';

function isType<T extends AstNode>(node: AstNode, type: T['type']): node is T {
  return node.type === type;
}

export const isAssignmentPattern = (node: AstNode): node is AssignmentPattern =>
  isType(node, 'AssignmentPattern');
export const isExportNamedDeclaration = (
  node: AstNode,
): node is ExportNamedDeclaration => isType(node, 'ExportNamedDeclaration');
export const isFunctionDeclaration = (
  node: AstNode,
): node is FunctionDeclaration => isType(node, 'FunctionDeclaration');
export const isIdentifier = (
  node: AstNode,
  options?: { name?: string },
): node is Identifier =>
  isType(node, 'Identifier') &&
  (options?.name === undefined || node.name === options.name);
export const isLiteral = (node: AstNode): node is Literal =>
  isType(node, 'Literal');
export const isObjectPattern = (node: AstNode): node is ObjectPattern =>
  isType(node, 'ObjectPattern');
export const isProgram = (node: AstNode): node is Program =>
  isType(node, 'Program');
export const isProperty = (node: AstNode): node is Property =>
  isType(node, 'Property');
export const isTSBooleanKeyword = (node: AstNode): node is TSBooleanKeyword =>
  isType(node, 'TSBooleanKeyword');
export const isTSPropertySignature = (
  node: AstNode,
): node is TSPropertySignature => isType(node, 'TSPropertySignature');
export const isTSStringKeyword = (node: AstNode): node is TSStringKeyword =>
  isType(node, 'TSStringKeyword');
export const isTSTypeAliasDeclaration = (
  node: AstNode,
): node is TSTypeAliasDeclaration => isType(node, 'TSTypeAliasDeclaration');
export const isTSTypeAnnotation = (node: AstNode): node is TSTypeAnnotation =>
  isType(node, 'TSTypeAnnotation');
export const isTSTypeLiteral = (node: AstNode): node is TSTypeLiteral =>
  isType(node, 'TSTypeLiteral');
export const isTSTypeReference = (node: AstNode): node is TSTypeReference =>
  isType(node, 'TSTypeReference');
