import type { NodePath } from '@babel/traverse';

export function ignore<T>(path: NodePath<T>): void {
  path.skip();
}

export const shallowIgnoreVisitors = {
  FunctionDeclaration: { enter: ignore },
  FunctionExpression: { enter: ignore },
  Class: { enter: ignore },
  IfStatement: { enter: ignore },
  WithStatement: { enter: ignore },
  SwitchStatement: { enter: ignore },
  CatchClause: { enter: ignore },
  Loop: { enter: ignore },
  ExportNamedDeclaration: { enter: ignore },
  ExportDefaultDeclaration: { enter: ignore },
  ConditionalExpression: { enter: ignore },
};
