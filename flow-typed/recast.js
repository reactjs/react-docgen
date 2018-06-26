/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*eslint no-unused-vars: 0*/

/**
 * A minimal set of declarations to make flow work with the recast API.
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

type Recast = {
  parse: (src: string) => ASTNode,
  print: (path: NodePath) => { code: string },
};
