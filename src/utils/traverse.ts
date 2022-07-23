import type { NodePath, Scope, Visitor } from '@babel/traverse';
import { default as babelTraverse } from '@babel/traverse';
import type { Node } from '@babel/types';

export function ignore<T>(path: NodePath<T>): void {
  path.skip();
}

/**
 * A helper function that doesn't traverse into nested blocks / statements by
 * default.
 */
export function traverseShallow(
  node: Node,
  visitors: Visitor,
  scope?: Scope | undefined,
): void {
  babelTraverse(node, { ...defaultVisitors, ...visitors }, scope);
}

const defaultVisitors = {
  FunctionDeclaration: ignore,
  FunctionExpression: ignore,
  ClassDeclaration: ignore,
  ClassExpression: ignore,
  IfStatement: ignore,
  WithStatement: ignore,
  SwitchStatement: ignore,
  WhileStatement: ignore,
  DoWhileStatement: ignore,
  ForStatement: ignore,
  ForInStatement: ignore,
  ForOfStatement: ignore,
  ExportNamedDeclaration: ignore,
  ExportDefaultDeclaration: ignore,
  ConditionalExpression: ignore,
};
