import type { AstNode } from './AstNode.js';
import type {
  AssignmentPattern,
  AssignmentExpression,
  BlockStatement,
  ArrayExpression,
  ArrowFunctionExpression,
  CallExpression,
  ClassDeclaration,
  ClassExpression,
  ExportNamedDeclaration,
  ExportDefaultDeclaration,
  ExpressionStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  Literal,
  MemberExpression,
  MethodDefinition,
  ObjectPattern,
  ObjectExpression,
  Program,
  Property,
  PropertyDefinition,
  ReturnStatement,
  SpreadElement,
  TSBooleanKeyword,
  TSInterfaceDeclaration,
  TSPropertySignature,
  TSStringKeyword,
  TSTypeAliasDeclaration,
  TSTypeAnnotation,
  TSTypeLiteral,
  TSTypeReference,
  VariableDeclaration,
  VariableDeclarator,
} from './nodes.js';

function isType<T extends AstNode>(node: AstNode, type: T['type']): node is T {
  return node.type === type;
}

export const isAssignmentPattern = (node: AstNode): node is AssignmentPattern =>
  isType(node, 'AssignmentPattern');
export const isAssignmentExpression = (
  node: AstNode,
): node is AssignmentExpression => isType(node, 'AssignmentExpression');
export const isArrayExpression = (node: AstNode): node is ArrayExpression =>
  isType(node, 'ArrayExpression');
export const isBlockStatement = (node: AstNode): node is BlockStatement =>
  isType(node, 'BlockStatement');
export const isArrowFunctionExpression = (
  node: AstNode,
): node is ArrowFunctionExpression => isType(node, 'ArrowFunctionExpression');
export const isCallExpression = (node: AstNode): node is CallExpression =>
  isType(node, 'CallExpression');
export const isClassDeclaration = (node: AstNode): node is ClassDeclaration =>
  isType(node, 'ClassDeclaration');
export const isClassExpression = (node: AstNode): node is ClassExpression =>
  isType(node, 'ClassExpression');
export const isExportDefaultDeclaration = (
  node: AstNode,
): node is ExportDefaultDeclaration => isType(node, 'ExportDefaultDeclaration');
export const isExportNamedDeclaration = (
  node: AstNode,
): node is ExportNamedDeclaration => isType(node, 'ExportNamedDeclaration');
export const isExpressionStatement = (
  node: AstNode,
): node is ExpressionStatement => isType(node, 'ExpressionStatement');
export const isFunctionDeclaration = (
  node: AstNode,
): node is FunctionDeclaration => isType(node, 'FunctionDeclaration');
export const isFunctionExpression = (
  node: AstNode,
): node is FunctionExpression => isType(node, 'FunctionExpression');
export const isIdentifier = (
  node: AstNode,
  options?: { name?: string },
): node is Identifier =>
  isType(node, 'Identifier') &&
  (options?.name === undefined || node.name === options.name);
export const isLiteral = (node: AstNode): node is Literal =>
  isType(node, 'Literal');
export const isMemberExpression = (node: AstNode): node is MemberExpression =>
  isType(node, 'MemberExpression');
export const isMethodDefinition = (node: AstNode): node is MethodDefinition =>
  isType(node, 'MethodDefinition');
export const isObjectPattern = (node: AstNode): node is ObjectPattern =>
  isType(node, 'ObjectPattern');
export const isObjectExpression = (node: AstNode): node is ObjectExpression =>
  isType(node, 'ObjectExpression');
export const isProgram = (node: AstNode): node is Program =>
  isType(node, 'Program');
export const isProperty = (node: AstNode): node is Property =>
  isType(node, 'Property');
export const isPropertyDefinition = (
  node: AstNode,
): node is PropertyDefinition => isType(node, 'PropertyDefinition');
export const isReturnStatement = (node: AstNode): node is ReturnStatement =>
  isType(node, 'ReturnStatement');
export const isSpreadElement = (node: AstNode): node is SpreadElement =>
  isType(node, 'SpreadElement');
export const isTSBooleanKeyword = (node: AstNode): node is TSBooleanKeyword =>
  isType(node, 'TSBooleanKeyword');
export const isTSInterfaceDeclaration = (
  node: AstNode,
): node is TSInterfaceDeclaration => isType(node, 'TSInterfaceDeclaration');
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
export const isVariableDeclaration = (
  node: AstNode,
): node is VariableDeclaration => isType(node, 'VariableDeclaration');
export const isVariableDeclarator = (
  node: AstNode,
): node is VariableDeclarator => isType(node, 'VariableDeclarator');
