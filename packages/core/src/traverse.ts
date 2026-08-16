import AstPath from './AstPath.js';
import type { AstNode, VisitorKeys } from './AstNode.js';
import type Scope from './Scope.js';

export type Visit<State> = (path: AstPath, state: State) => void;

export interface VisitorHandler<State> {
  enter?: Visit<State>;
  exit?: Visit<State>;
}

export type VisitorEntry<State> = Visit<State> | VisitorHandler<State>;

export type Visitor<State> = Record<string, VisitorEntry<State> | undefined> & {
  enter?: Visit<State>;
  exit?: Visit<State>;
};

function callVisitor<State>(
  entry: VisitorEntry<State> | undefined,
  phase: keyof VisitorHandler<State>,
  path: AstPath,
  state: State,
): void {
  if (typeof entry === 'function') {
    if (phase === 'enter') {
      entry(path, state);
    }
  } else {
    entry?.[phase]?.(path, state);
  }
}

export default function traverse<State>(
  node: AstNode,
  visitorKeys: VisitorKeys,
  visitor: Visitor<State>,
  state: State,
  scope?: Scope,
): void {
  let stopped = false;

  function visit(path: AstPath): void {
    visitor.enter?.(path, state);
    callVisitor(visitor[path.node.type], 'enter', path, state);

    if (path.shouldStop) {
      stopped = true;
    }

    if (stopped || path.shouldSkip) {
      return;
    }

    for (const name of visitorKeys[path.node.type] ?? []) {
      const childPaths = path.get(name);

      if (Array.isArray(childPaths)) {
        for (const childPath of childPaths) {
          visit(childPath);

          if (stopped) {
            return;
          }
        }
      } else if (childPaths) {
        visit(childPaths);

        if (stopped) {
          return;
        }
      }
    }

    callVisitor(visitor[path.node.type], 'exit', path, state);
    visitor.exit?.(path, state);

    if (path.shouldStop) {
      stopped = true;
    }
  }

  visit(new AstPath({ node, scope }));
}
