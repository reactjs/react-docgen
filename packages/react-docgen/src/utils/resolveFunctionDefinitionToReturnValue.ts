import type { NodePath } from '@babel/traverse';
import { visitors } from '@babel/traverse';
import type { Expression, Function as BabelFunction } from '@babel/types';
import resolveToValue from './resolveToValue';
import { ignore, shallowIgnoreVisitors } from './traverse';

interface TraverseState {
  returnPath?: NodePath<Expression>;
}

const explodedVisitors = visitors.explode<TraverseState>({
  ...shallowIgnoreVisitors,

  Function: { enter: ignore },
  ReturnStatement: {
    enter: function (nodePath, state) {
      const argument = nodePath.get('argument');

      if (argument.hasNode()) {
        state.returnPath = resolveToValue(argument) as NodePath<Expression>;

        return nodePath.stop();
      }

      nodePath.skip();
    },
  },
});

// TODO needs unit test

export default function resolveFunctionDefinitionToReturnValue(
  path: NodePath<BabelFunction>,
): NodePath<Expression> | null {
  const body = path.get('body');
  const state: TraverseState = {};

  body.traverse(explodedVisitors, state);

  return state.returnPath || null;
}
