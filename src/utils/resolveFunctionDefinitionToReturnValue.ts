import type { NodePath } from '@babel/traverse';
import type { Expression, Function as BabelFunction } from '@babel/types';
import resolveToValue from './resolveToValue';
import { ignore, traverseShallow } from './traverse';

// TODO needs unit test

export default function resolveFunctionDefinitionToReturnValue(
  path: NodePath<BabelFunction>,
): NodePath<Expression> | null {
  let returnPath: NodePath | null = null;

  const body = path.get('body');

  traverseShallow(body, {
    Function: ignore,
    ReturnStatement: nodePath => {
      const argument = nodePath.get('argument');

      if (argument.hasNode()) {
        returnPath = resolveToValue(argument);
      }
      nodePath.skip();
    },
  });

  return returnPath;
}
