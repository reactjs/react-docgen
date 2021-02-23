import { namedTypes as t } from 'ast-types';
import isReactModuleName from './isReactModuleName';
import match from './match';
import resolveToModule from './resolveToModule';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

/**
 * Returns true if the expression is a function call of the form
 * `React.Children.only(...)`.
 */
export default function isReactChildrenElementCall(
  path: NodePath,
  importer: Importer,
): boolean {
  if (t.ExpressionStatement.check(path.node)) {
    path = path.get('expression');
  }

  if (!match(path.node, { callee: { property: { name: 'only' } } })) {
    return false;
  }

  const calleeObj = path.get('callee', 'object');
  const module = resolveToModule(calleeObj, importer);

  if (!match(calleeObj, { value: { property: { name: 'Children' } } })) {
    return false;
  }

  return Boolean(module && isReactModuleName(module));
}
