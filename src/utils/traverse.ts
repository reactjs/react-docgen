import type { NodePath, Visitor } from '@babel/traverse';

export function ignore<T>(path: NodePath<T>): void {
  path.skip();
}

/**
 * A helper function that doesn't traverse into nested blocks / statements by
 * default.
 */
export function traverseShallow(path: NodePath, visitors: Visitor): void {
  path.traverse({ ...shallowIgnoreVisitors, ...visitors });
}

const shallowIgnoreVisitors = {
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
