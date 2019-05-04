/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/*eslint no-unused-vars: 0*/

/**
 * A minimal set of declarations to make flow work with the ast-types API.
 */

type ASTNode = Object;

declare class Scope {
  lookup(name: string): ?Scope;
  lookupType(name: string): ?Scope;
  getBindings(): { [key: string]: Array<NodePath> };
  getTypes(): { [key: string]: Array<NodePath> };
  node: NodePath;
}

declare class NodePath {
  value: ASTNode | Array<ASTNode>;
  node: ASTNode;
  parent: NodePath;
  parentPath: NodePath;
  scope: Scope;

  get(...x: Array<string | number>): NodePath;
  each(f: (p: NodePath) => any): any;
  map<T>(f: (p: NodePath) => T): Array<T>;
  filter(f: (p: NodePath) => boolean): Array<NodePath>;
  push(node: ASTNode): void;
}
