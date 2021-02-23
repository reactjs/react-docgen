import { visit } from 'ast-types';
import type { NodePath } from 'ast-types/lib/node-path';

type Visitor = (path: NodePath) => unknown;

/**
 * A helper function that doesn't traverse into nested blocks / statements by
 * default.
 */
export function traverseShallow(
  path: NodePath,
  visitors: { [key: string]: Visitor },
): void {
  // @ts-ignore
  visit(path, { ...defaultVisitors, ...visitors });
}

const ignore = () => false;
const defaultVisitors = {
  visitFunctionDeclaration: ignore,
  visitFunctionExpression: ignore,
  visitClassDeclaration: ignore,
  visitClassExpression: ignore,
  visitIfStatement: ignore,
  visitWithStatement: ignore,
  visitSwitchStatement: ignore,
  visitWhileStatement: ignore,
  visitDoWhileStatement: ignore,
  visitForStatement: ignore,
  visitForInStatement: ignore,
  visitForOfStatement: ignore,
  visitExportNamedDeclaration: ignore,
  visitExportDefaultDeclaration: ignore,
  visitConditionalExpression: ignore,
};
