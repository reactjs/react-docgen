import isReactBuiltinCall from './isReactBuiltinCall';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

/**
 * Returns true if the expression is a function call of the form
 * `React.createElement(...)`.
 */
export default function isReactCreateElementCall(
  path: NodePath,
  importer: Importer,
): boolean {
  return isReactBuiltinCall(path, 'createElement', importer);
}
