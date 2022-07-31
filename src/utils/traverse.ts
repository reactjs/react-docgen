import type { NodePath } from '@babel/traverse';

export function ignore<T>(path: NodePath<T>): void {
  path.skip();
}

export const shallowIgnoreVisitors = {
  FunctionDeclaration: { enter: ignore },
  FunctionExpression: { enter: ignore },
  ClassDeclaration: { enter: ignore },
  ClassExpression: { enter: ignore },
  IfStatement: { enter: ignore },
  WithStatement: { enter: ignore },
  SwitchStatement: { enter: ignore },
  CatchClause: { enter: ignore },
  WhileStatement: { enter: ignore },
  DoWhileStatement: { enter: ignore },
  ForStatement: { enter: ignore },
  ForInStatement: { enter: ignore },
  ForOfStatement: { enter: ignore },
  ExportNamedDeclaration: { enter: ignore },
  ExportDefaultDeclaration: { enter: ignore },
  ConditionalExpression: { enter: ignore },
};
