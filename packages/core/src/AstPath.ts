import { isAstNode, type AstNode } from './AstNode.js';
import type Scope from './Scope.js';

interface AstPathOptions<N extends AstNode> {
  node: N;
  parentPath?: AstPath;
  key?: number | string;
  listKey?: string;
  scope?: Scope;
}

export default class AstPath<N extends AstNode = AstNode> {
  readonly node: N;
  readonly parentPath: AstPath | null;
  readonly key: number | string | null;
  readonly listKey: string | null;
  readonly scope: Scope | null;

  shouldSkip = false;
  shouldStop = false;

  constructor({ node, parentPath, key, listKey, scope }: AstPathOptions<N>) {
    this.node = node;
    this.parentPath = parentPath ?? null;
    this.key = key ?? null;
    this.listKey = listKey ?? null;
    this.scope = scope ?? parentPath?.scope ?? null;
  }

  get(name: string): AstPath | AstPath[] | null {
    const value = this.node[name];

    if (isAstNode(value)) {
      return new AstPath({ node: value, parentPath: this, key: name });
    }

    if (Array.isArray(value)) {
      return value.flatMap((node, index) =>
        isAstNode(node)
          ? [
              new AstPath({
                node,
                parentPath: this,
                key: index,
                listKey: name,
              }),
            ]
          : [],
      );
    }

    return null;
  }

  skip(): void {
    this.shouldSkip = true;
  }

  stop(): void {
    this.shouldStop = true;
  }
}
