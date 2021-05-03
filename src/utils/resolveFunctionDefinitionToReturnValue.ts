import resolveToValue from './resolveToValue';
import { traverseShallow } from './traverse';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';
import { ReturnStatement } from 'typescript';

export default function resolveFunctionDefinitionToReturnValue(
  path: NodePath,
  importer: Importer,
): NodePath | null {
  let returnPath: NodePath | null = null;

  traverseShallow(path.get('body'), {
    visitFunction: () => false,
    visitReturnStatement: (nodePath: NodePath<ReturnStatement>): false => {
      returnPath = resolveToValue(nodePath.get('argument'), importer);
      return false;
    },
  });

  return returnPath;
}
