/*
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 */

type Visitor = (path: NodePath) => any;

import recast from 'recast';

/**
 * A helper function that doesn't traverse into nested blocks / statements by
 * default.
 */
export function traverseShallow(
  ast: ASTNode,
  visitors: { [key: string]: Visitor },
): void {
  recast.visit(ast, { ...defaultVisitors, ...visitors });
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
  visitExportDeclaration: ignore,
  visitExportNamedDeclaration: ignore,
  visitExportDefaultDeclaration: ignore,
  visitConditionalExpression: ignore,
};
