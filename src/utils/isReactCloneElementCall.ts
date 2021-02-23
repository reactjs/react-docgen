import isReactBuiltinCall from './isReactBuiltinCall';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';

/**
 * Returns true if the expression is a function call of the form
 * `React.cloneElement(...)`.
 */
export default function isReactCloneElementCall(
  path: NodePath,
  importer: Importer,
): boolean {
  return isReactBuiltinCall(path, 'cloneElement', importer);
}
